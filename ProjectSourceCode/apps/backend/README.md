# backend

Express 5 HTTP API + Socket.IO WebSocket server.

## Local setup

Before running `pnpm dev`, create a local `.env`:

```sh
cp .env.example .env
# edit DATABASE_URL, SESSION_SECRET, and FRONTEND_ORIGINS
```

The dev script loads `.env` strictly: missing required variables cause startup failure with a clear error. Cloud
environments set env vars via the container runtime config, not from `.env`.

### Required env vars

- `DATABASE_URL`: Postgres connection string (session store)
- `SESSION_SECRET`: cookie signing secret
- `FRONTEND_ORIGINS`: comma-separated list of allowed origins (CORS + Socket.IO)

### Optional env vars

- `REDIS_URL`: enables the Socket.IO Redis adapter. Without it, the in-memory adapter is used.
- `PORT` (default 3001), `LOG_LEVEL` (default info), `NODE_ENV` (default development)

## Scripts

- `pnpm --filter backend dev`: hot-reload dev server (tsx watch)
- `pnpm --filter backend test`: Vitest + supertest
- `pnpm --filter backend... build`: compile backend + its workspace deps in dep order
- `pnpm --filter backend start`: run compiled dist/index.js

## Routes

Full API contract at `packages/contracts/api/public/openapi.yaml`.

- `GET /api/health`: service health status
- `GET /api/auth/me`: current session user, 401 if not authenticated

## Sockets

Socket.IO mounted at `/socket.io/`. Event types sourced from `@diplomacy/contracts`.

The HTTP session middleware is attached to the WebSocket handshake via `io.engine.use(sessionMiddleware)`, so
`socket.request.session` matches `req.session` from HTTP handlers.

### Events

- `health:ping` (client -> server): no payload
- `health:pong` (server -> client): `{ timestamp: number }`

### Redis adapter

With `REDIS_URL` set, Socket.IO uses the Redis adapter for cross-process broadcast. Without it, the in-memory adapter is
used and broadcasts stay within a single Node process.
