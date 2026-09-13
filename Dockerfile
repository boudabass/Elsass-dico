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
# Plus aucune variable de build depuis le 12/09/2026 : les deux
# `NEXT_PUBLIC_SUPABASE_*` sont parties avec Supabase. Tout ce dont l'app a
# besoin est désormais RUNTIME — `DATABASE_URL`, `SESSION_SECRET`, `ODOO_*` —
# donc rien de sensible n'est gravé dans l'image. C'est aussi ce qui fait qu'une
# variable oubliée se voit au démarrage et non au build : `SESSION_SECRET`
# manquante fait échouer la vérification de session, bruyamment, au lieu de
# déconnecter tout le monde en silence (cf. src/lib/session.ts).
#
# Les Build Variables correspondantes restent à retirer côté Coolify : elles
# n'ont plus d'effet, mais les laisser ferait croire qu'elles en ont.
RUN pnpm build

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
# SURTOUT PAS `package.json` ici. Avec lui, `npm install` ne se contente plus
# d'ajouter deux paquets : il résout tout le graphe du projet et meurt sur un
# conflit de peer dependencies (react 19.1 contre 19.3, ERESOLVE). Ce répertoire
# doit rester nu — la CLI Prisma n'a besoin que de `prisma/` et de sa config.
RUN npm install --no-save --no-package-lock prisma@7.10.0 dotenv

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
