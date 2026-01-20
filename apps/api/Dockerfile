FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
# Copy entire monorepo to ensure all workspaces/packages are available
COPY . .
# Install dependencies (including dev deps for building)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Generate Prisma Client
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=api add -D dotenv
# Set dummy DATABASE_URL for prisma generate to work during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm --filter=api exec prisma generate
# Build the API
RUN pnpm turbo run build --filter=api...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from builder
# We copy the whole node_modules to ensure all dependencies (including workspace symlinks if any, though in pnpm they are links) are present.
# Ideally we would prune devDeps, but for a guaranteed run in a complex monorepo without 'deploy', copying is safest.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 8080
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/src/main"]
