# syntax=docker/dockerfile:1.7

# Multi-stage build for the Diplomacy worker.
# Build context MUST be the monorepo root (ProjectSourceCode/), not apps/worker/.
# Example: docker build -f apps/worker/Dockerfile -t diplomacy-worker .

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS base
RUN corepack enable
WORKDIR /app

# Install stage: copy workspace manifests first for cache efficiency,
# then install only worker + its transitive workspace deps.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ai/package.json ./packages/ai/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/game-types/package.json ./packages/game-types/
COPY packages/queues/package.json ./packages/queues/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile --filter worker... --ignore-scripts

# Dev stage: reuses deps installed above; source arrives via volume mount from compose.
FROM deps AS dev
CMD ["pnpm", "--filter", "worker", "run", "dev:container"]

# Build stage: copy source and build worker + its workspace deps.
FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm --filter worker... run build

# Runtime stage: minimal image with just what's needed to run.
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS runtime
RUN apk add --no-cache tini
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=build --chown=app:app /app /app
ENV NODE_ENV=production
USER app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/worker/dist/index.js"]
