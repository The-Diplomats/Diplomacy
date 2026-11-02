# syntax=docker/dockerfile:1.7

# Multi-stage build for the Diplomacy worker.
# Build context MUST be the monorepo root (ProjectSourceCode/), not apps/worker/.
# Example: docker build -f apps/worker/Dockerfile -t diplomacy-worker .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# Install stage: copy workspace manifests first for cache efficiency,
# then install only worker + its transitive workspace deps.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/queues/package.json ./packages/queues/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile --filter worker...

# Build stage: copy source and build worker + its workspace deps.
FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm --filter worker... run build

# Runtime stage: minimal image with just what's needed to run.
FROM node:24-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=build --chown=app:app /app /app
ENV NODE_ENV=production
USER app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/worker/dist/index.js"]
