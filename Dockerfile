# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

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

# Set environment variables for Next.js production mode
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install pnpm in production stage too (optional for running scripts, but good practice)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create volume mount points with correct permissions
RUN mkdir -p /app/data && mkdir -p /app/public/games

# Copy only necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose the port
EXPOSE 3000

# Command to run the Next.js application
CMD ["pnpm", "start"]
