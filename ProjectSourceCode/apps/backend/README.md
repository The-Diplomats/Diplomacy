# @diplomacy/backend

Express 5 HTTP API server.

## Scripts

- `pnpm --filter @diplomacy/backend dev`: hot-reload dev server (tsx watch)
- `pnpm --filter @diplomacy/backend test`: Vitest + supertest
- `pnpm --filter @diplomacy/backend build`: compile to dist/
- `pnpm --filter @diplomacy/backend start`: run compiled dist/index.js

## Routes

Current stub. Full API contract at `packages/contracts/api/public/openapi.yaml`.

- `GET /api/health`: service health status
