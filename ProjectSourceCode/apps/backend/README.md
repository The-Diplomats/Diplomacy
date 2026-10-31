# backend

Express 5 HTTP API server.

## Scripts

- `pnpm --filter backend dev`: hot-reload dev server (tsx watch)
- `pnpm --filter backend test`: Vitest + supertest
- `pnpm --filter backend... build`: compile backend + its workspace deps in dep order
- `pnpm --filter backend start`: run compiled dist/index.js

## Routes

Current stub. Full API contract at `packages/contracts/api/public/openapi.yaml`.

- `GET /api/health`: service health status
