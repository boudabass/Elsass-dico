# Stage 1: Build the Next.js application
#
# Node 22 et non 20 : pnpm 11 charge `node:sqlite`, un module interne apparu en
# Node 22.13. Sur node:20-alpine, `pnpm install` meurt sur
# ERR_UNKNOWN_BUILTIN_MODULE — pnpm le dit d'ailleurs dans un avertissement,
# juste avant de planter. Découvert au premier build Coolify après le passage en
# pnpm 11 : ce couple de versions ne se vérifie PAS en local, où Node est déjà
# en 24. Un `tsc` et un `next build` propres ne prouvent rien sur l'image.
FROM node:22-alpine AS builder

# Install pnpm. Version alignée sur celle du poste qui écrit le lockfile : la
# 10.33.2 lisait bien le lockfileVersion 9.0, mais elle ignore le bloc
# `allowBuilds` de pnpm-workspace.yaml (nommé `onlyBuiltDependencies` chez elle)
# — donc le postinstall de Prisma n'y tournerait pas, sans le dire.
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app

# Copy package files.
#
# `pnpm-workspace.yaml` EN FAIT PARTIE : c'est lui qui porte `allowBuilds`, donc
# l'autorisation donnée au postinstall de Prisma d'installer son schema-engine.
# Sans ce fichier, pnpm 11 saute ces scripts et l'image se construit quand même —
# la panne n'apparaîtrait qu'au démarrage, sur `prisma migrate deploy`.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Le schéma AVANT l'installation : `postinstall` lance `prisma generate`, qui
# cherche `prisma/schema.prisma`. Copier le reste du code après, comme le veut le
# cache de couches Docker, laissait l'installation échouer sur un schéma absent.
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application.
#
# `DATABASE_URL` redevient nécessaire ICI, et seulement ici — `/village/[slug]`
# et `/prenom/[slug]` (doc 20, étape 3) lisent la base dans
# `generateStaticParams` pour pré-rendre les fiches publiques. `SESSION_SECRET`
# et `ODOO_*` restent, eux, strictement RUNTIME : rien à leur sujet ne change.
#
# Essayé d'abord en secret BuildKit (`--mount=type=secret`, jamais écrit dans
# une couche) pour ne rien devoir à la règle du 12/09 sur les Build Variables.
# **Confirmé non fonctionnel sur ce Coolify** au premier déploiement du
# 13/09/2026 : le secret arrivait vide, la garde ci-dessous a fait échouer le
# build avec exactement le message attendu — Coolify ne relaie donc pas de
# secret BuildKit à id libre ici (la discussion GitHub coollabsio/coolify#5328,
# restée sans réponse, avait raison d'en douter). Repli appliqué : `ARG`
# classique, alimenté par une Build Variable Coolify comme l'étaient les
# `NEXT_PUBLIC_SUPABASE_*` avant le 12/09. Compromis assumé : la valeur reste
# lisible dans l'historique des couches du builder — mais cette image n'est
# jamais poussée sur un registre public, et l'étage final (seul livré) ne la
# copie pas.
#
# Échoue bruyamment si la variable manque, plutôt que de construire une image
# aux deux routes silencieusement non pré-rendues (`dynamicParams` les
# rendrait quand même à la demande, mais en perdant le "zéro requête au
# runtime" qui est tout l'intérêt de la génération statique ici).
ARG DATABASE_URL
RUN if [ -z "$DATABASE_URL" ]; then \
        echo "DATABASE_URL manquante au build : requise pour generateStaticParams (/village, /prenom). À poser comme Build Variable Coolify." >&2; \
        exit 1; \
    fi && \
    pnpm build

# Stage 2: Create the production-ready image.
# Même majeure que le builder : la sortie standalone embarque des dépendances
# résolues pour cette version-là.
FROM node:22-alpine

# Install CA certificates for HTTPS requests
RUN apk add --no-cache ca-certificates

# Set environment variables for Next.js production mode
ENV NODE_ENV=production
ENV PORT=3000

# Sans cela, le serveur standalone n'écoute que sur localhost et reste
# injoignable depuis l'extérieur du conteneur.
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# La sortie standalone embarque son propre serveur et les seules dépendances
# tracées : ni node_modules complet, ni pnpm dans cette étape. En revanche
# elle n'inclut ni public/ ni .next/static, qu'il faut copier à part.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# La sortie standalone embarque une COPIE INTÉGRALE de package.json — pas un
# extrait — avec tout le graphe de dépendances de l'app (react-hook-form,
# @radix-ui/*, etc.). Rien à voir avec `node server.js`, qui ne le lit jamais :
# Next l'y met pour un `npm start` que ce Dockerfile n'utilise pas. Retiré tout
# de suite, avant qu'un `npm install` plus bas ne le trouve dans son répertoire
# de travail et ne tente de résoudre tout ce graphe (cf. plus bas).
RUN rm -f package.json

# --- Migrations appliquées au démarrage -------------------------------------
#
# « Coolify n'applique aucune migration » a coûté trois incidents (09/08, 10/08,
# 23/08) : une migration passée à la main dans le SQL Editor, oubliée, invisible
# jusqu'à la première écriture — le site répondait 200 pendant ce temps. Le
# conteneur applique donc lui-même ce qui manque, avant d'ouvrir le port.
#
# La CLI Prisma vit dans /opt/prisma-cli, un répertoire COMPLÈTEMENT séparé de
# /app — schéma, config ET dépendances y sont réunis, plutôt qu'éclatés entre
# les deux comme dans les trois tentatives précédentes (13/09/2026) :
#   1. `npm install` DANS `/app` — même sans `package.json` (la sortie
#      standalone en embarque une copie intégrale, retirée plus haut), npm
#      scanne `node_modules/.pnpm/` déjà présent (la structure RÉELLE que
#      pnpm résout derrière ses liens symboliques, pas un `node_modules`
#      classique) et part en plusieurs minutes d'avertissements ERESOLVE sur
#      des paquets sans rapport (jest, eslint-config-standard…).
#   2. Installer à part (`/tmp/prisma-cli`) puis `cp -r` le résultat DANS
#      `/app/node_modules` — l'installation isolée réussit (prisma embarque
#      Prisma Studio, donc React : ~136 paquets), mais `cp` refuse d'écrire
#      par-dessus `node_modules/react`, lien symbolique pnpm côté standalone
#      et non un dossier réel : « target (...) is not a directory ».
# Les deux échouaient pour la même raison : faire cohabiter deux
# `node_modules` d'origines différentes dans UN SEUL dossier. Le déplacement
# résout ça, mais en ouvre une troisième, plus sournoise : `prisma.config.ts`
# importe lui-même `dotenv` et `defineConfig` de `"prisma/config"` — deux
# imports qui, une fois le fichier posé dans `/app`, se seraient résolus
# depuis `/app/node_modules` (Node résout depuis l'EMPLACEMENT DU FICHIER, pas
# depuis celui du binaire qui l'exécute). Ni l'un ni l'autre n'y existerait :
# `dotenv` n'est dans le graphe d'aucune route Next (le traçage de la sortie
# standalone ne l'embarque donc pas), et `prisma` n'y a jamais été installé.
# D'où schéma et config copiés ICI, dans `/opt/prisma-cli` et non dans `/app` :
# tout ce dont la CLI a besoin — binaire, dépendances, schéma, config — vit
# désormais au même endroit, sans qu'aucune résolution ne traverse vers /app.
RUN mkdir /opt/prisma-cli
WORKDIR /opt/prisma-cli
RUN npm install --no-save --no-package-lock prisma@7.10.0 dotenv
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
WORKDIR /app

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
