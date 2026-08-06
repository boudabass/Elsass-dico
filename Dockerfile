# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Install pnpm (version pinnée : compatible avec lockfileVersion 9.0 du pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN pnpm build

# Stage 2: Create the production-ready image
FROM node:20-alpine

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

# Expose the port
EXPOSE 3000

# Command to run the Next.js application
CMD ["node", "server.js"]
