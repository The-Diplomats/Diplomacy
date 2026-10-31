# backend

Express 5 HTTP API server.

## Local setup

Before running `pnpm dev`, create a local `.env`:

```sh
cp .env.example .env
# edit .env with real DATABASE_URL and SESSION_SECRET
```

The dev script loads `.env` strictly: missing variables cause startup failure with a clear error. Cloud environments set
env vars via the container runtime config, not from `.env`.

## Scripts

- `pnpm --filter backend dev`: hot-reload dev server (tsx watch)
- `pnpm --filter backend test`: Vitest + supertest
- `pnpm --filter backend... build`: compile backend + its workspace deps in dep order
- `pnpm --filter backend start`: run compiled dist/index.js

## Routes

Current stub. Full API contract at `packages/contracts/api/public/openapi.yaml`.

- `GET /api/health`: service health status
