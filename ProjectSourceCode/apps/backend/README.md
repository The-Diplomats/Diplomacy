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

## Surfaces

Requests are classified by hostname into one of three surfaces:

- `api.*.diplomacy.gg`: HTTP routes + Socket.IO upgrades
- `admin.*.diplomacy.gg`: admin router
- `localhost`, `127.0.0.1`: dev surface, serves both api and admin routes

Unknown hosts return 404 at the first middleware. The classifier lives in `src/surface.ts`.

Admin access is gated by an email allowlist in `src/middleware/require-admin.ts`.

## Routes

Full API contract at `packages/contracts/api/public/openapi.yaml`.

### api surface

- `GET /health`: service health status
- `GET /auth/me`: current session user, 401 if not authenticated

### admin surface

- `GET /queues`: 403 for non-admins, 503 otherwise

## Adding an api endpoint

Contract-first. Example: `GET /games`.

1. Edit `packages/contracts/api/public/openapi.yaml`. The file already has top-level `tags:`, `paths:`, and
   `components.schemas:` sections. Append to each (don't replace):
   ```yaml
   tags:
     # ... existing tags (Health, Auth) ...
     - name: Games
       description: Game lifecycle

   paths:
     # ... existing paths (/health, /auth/me) ...
     /games:
       get:
         operationId: listGames # becomes useListGames hook + listGames fn in generated client
         tags: [Games]
         summary: List games
         responses:
           '200':
             description: OK
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/GamesList'

   components:
     schemas:
       # ... existing schemas (HealthStatus, User, ProblemDetails) ...
       GamesList:
         type: object
         required: [games]
         additionalProperties: false
         properties:
           games:
             type: array
             items:
               $ref: '#/components/schemas/Game'
       Game:
         type: object
         required: [id, name]
         additionalProperties: false
         properties:
           id:
             type: string
             format: uuid
           name:
             type: string
   ```
2. Regenerate the typed client and parsed spec:
   ```sh
   pnpm --filter @diplomacy/contracts build
   ```
3. Create the handler at `src/routes/api/games.ts`:
   ```ts
   import type { GamesList } from '@diplomacy/contracts';
   import { type Request, type Response, Router } from 'express';

   export const gamesRouter = Router();

   gamesRouter.get('/', (_req: Request, res: Response<GamesList>) => {
     res.json({ games: [] });
   });
   ```
4. Mount in `src/routes/api/index.ts`:
   ```ts
   import { gamesRouter } from './games.js';
   // inside createApiSurface:
   api.use('/games', gamesRouter);
   ```
5. Add a test in `src/app.test.ts`.

`src/app.ts` is not touched for route additions. Request validation and response typing come from the OpenAPI spec via
`express-openapi-validator` and the generated `@diplomacy/contracts` types.

## Sockets

Socket.IO mounted at `/socket.io/` on the api surface. Event types sourced from `@diplomacy/contracts`.

The HTTP session middleware is attached to the WebSocket handshake via `io.engine.use(sessionMiddleware)`, so
`socket.request.session` matches `req.session` from HTTP handlers.

Transport: WebSocket only. Polling fallback is disabled so the backend can run multi-replica behind the Redis adapter
without sticky sessions.

### Events

- `health:ping` (client -> server): no payload
- `health:pong` (server -> client): `{ timestamp: number }`

### Redis adapter

With `REDIS_URL` set, Socket.IO uses the Redis adapter for cross-process broadcast. Without it, the in-memory adapter is
used and broadcasts stay within a single Node process.
