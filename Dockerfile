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
# La CLI est réinstallée ici plutôt que copiée du builder : avec pnpm,
# `node_modules/prisma` n'est qu'un lien symbolique vers le store `.pnpm`, et le
# copier seul donnerait un lien cassé. `npm install` exécute au passage le
# postinstall qui pose le schema-engine, dont `migrate deploy` a besoin.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Régression trouvée sur le premier vrai déploiement Coolify de ce Dockerfile
# (13/09/2026) : le commentaire disait « ce répertoire doit rester nu » en ne
# pensant qu'à un `COPY package.json` explicite (retiré au commit précédent,
# lui bien nu) — sans voir que le `package.json` de la sortie standalone,
# copié juste au-dessus, en tenait lieu. `npm install` le trouvait donc quand
# même et mourait sur le même ERESOLVE (react 19.1 contre react-dom 19.3 via
# @radix-ui/react-accordion). Un `docker build` isolé dans un conteneur
# `node:22-alpine` nu, comme la vérification du commit précédent, ne pouvait
# pas voir cette copie implicite — elle n'existe que dans le VRAI enchaînement
# multi-étages. Le `rm -f package.json` ci-dessus est ce qui rend ce répertoire
# effectivement nu, plutôt que le commentaire seul.
RUN npm install --no-save --no-package-lock prisma@7.10.0 dotenv

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
