# syntax=docker/dockerfile:1.7

# Multi-stage build for the Diplomacy backend.
# Build context MUST be the monorepo root (ProjectSourceCode/), not apps/backend/.
# Example: docker build -f apps/backend/Dockerfile -t diplomacy-backend .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# Install stage: copy workspace manifests first for cache efficiency,
# then install only backend + its transitive workspace deps.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/game-types/package.json ./packages/game-types/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/adjudicator/package.json ./packages/adjudicator/
COPY packages/db/package.json ./packages/db/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --filter backend...

# Build stage: copy source and build backend + its workspace deps.
FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
RUN pnpm --filter backend... run build

# Runtime stage: minimal image with just what's needed to run.
FROM node:24-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=build --chown=app:app /app /app
USER app
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/backend/dist/index.js"]
