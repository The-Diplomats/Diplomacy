# AGENTS.md — apps/backend

Express 5 HTTP API + Socket.IO WebSocket server. Read `ProjectSourceCode/AGENTS.md` for monorepo rules first; this file
covers backend-specific patterns.

## Directory layout

```
src/
├── app.ts                  # Express app factory (used in tests + prod)
├── index.ts                # bootstrap: load env, call initDb/initEmails, listen
├── socket.ts               # Socket.IO server factory
├── sockets/                # typed event handlers + room join auth
├── surface.ts              # hostname-based routing (api / admin / dev)
├── auth/                   # password hash, session helpers, verification-code
├── email/                  # sender interface + templates + auth-emails
├── middleware/             # openapi-validator, rate limits, host-router, require-admin
├── repositories/           # per-table data access (users, players, verification-tokens)
├── routes/
│   └── api/                # /api/* handlers mounted by surface
│       ├── auth/           # login, register(+/verify, /resend), password-reset(+/verify), logout, me
│       └── health.ts
├── services/               # module-singleton initializers (db, emails)
├── scripts/
│   └── seed.ts             # dev-only bootstrap; NODE_ENV=production guarded
└── test/
    └── db.ts               # test setup helpers (setupTestServices, makeTestCredentials)
```

## Adding an API endpoint

Contract-first. Four steps, in order:

1. **Edit the OpenAPI spec** at `packages/contracts/api/public/openapi.yaml`. Append to `tags:`, `paths:`, and
   `components.schemas:` — don't replace existing sections.
2. **Regenerate the client**: `pnpm --filter @diplomacy/contracts build`. Don't hand-edit generated files.
3. **Write the handler** at `src/routes/api/<group>.ts` using the typed `Response<GeneratedType>`.
4. **Mount the router** in `src/routes/api/index.ts`.
5. **Write a test** in `src/<name>.test.ts` or in the route's local test file. Integration tests hit a real DB via
   `src/test/db.ts` helpers.

`src/app.ts` is **not** touched for route additions. Request validation + response typing both come from the spec via
`express-openapi-validator` and `@diplomacy/contracts` types.

Example shape:

```ts
import type { GamesList } from '@diplomacy/contracts';
import { type Request, type Response, Router } from 'express';

export const gamesRouter = Router();

gamesRouter.get('/', (_req: Request, res: Response<GamesList>) => {
  res.json({ games: [] });
});
```

## Auth

- **Session-based.** `connect-pg-simple` stores sessions in Postgres; cookie is `SameSite=Lax` scoped to `.diplomacy.gg`
  in cloud envs, host-only in local dev.
- **Pattern B registration.** `/auth/register` inserts a user row with `email_verified_at = NULL`, issues a 6-digit
  code, returns 202 (enumeration-safe). The user can't log in until `/auth/register/verify` succeeds.
- **Enumeration-safe 202s.** `/auth/register`, `/auth/register/resend`, `/auth/password-reset` all return 202 regardless
  of whether the account exists / is verified / has a password. Don't branch the response shape on the user's state —
  branch internal behavior only.
- **Session regen on auth state change.** Call `establishSession(req, publicUser)` (which wraps
  `req.session.regenerate()`) after verify / password-reset-verify / login. Never assign `req.session.user` without
  regenerating first — session-fixation defense.
- **Password hash: `crypto.scrypt`** via `src/auth/password.ts` (`hashPassword`, `verifyPassword`). Never roll your own.
- **Verification codes: `src/auth/verification-code.ts`.** 6-digit via `randomInt`; stored as SHA-256 in
  `verification_tokens.token_hash`; TTL from `VERIFICATION_CODE_TTL_MINUTES`. Never compare plaintext codes to DB rows.
- **`findByIdentifier` routes on `@`** — email path if the identifier contains `@`, username path otherwise.
  Deterministic. Don't change this to OR + findFirst.

## Email

- **Provider is Resend** via `src/email/sender.ts`. `RESEND_API_KEY` unset → emails print to backend logs (logging
  sender). No teammate needs a real inbox for local dev.
- **Templates in `src/email/templates/`.** One file per email. Keep them plain HTML + small text fallback.
- **Auth emails route through `emails.auth.*`** (`src/services/emails.ts`). Don't call `sender.send` directly from route
  handlers — go through the typed `AuthEmails` interface.
- **URL params in email links** use `URLSearchParams` for safe encoding. Verify link params:
  `?code=X&identifier=<email>` (register) or `?code=X&email=<email>` (reset).

## Rate limiting

- **Per-route IP limits on auth endpoints** via `src/middleware/auth-rate-limits.ts`. Current caps: register 5/hr,
  register-verify 10/15min, register-resend 3/min, password-reset 3/hr, password-reset-verify 10/15min.
- **Login has its own IP limit** via `src/middleware/login-rate-limit.ts` (credential-stuffing defense).
- **Local uses `MemoryStore`**, cloud uses `rate-limit-redis` on Upstash. Both wired behind the same
  `createXxxRateLimit()` factory.
- **Test seam: `resetAuthRateLimits()`** clears in-memory state between tests. Call in `beforeEach` for test files that
  hit auth endpoints.

## Host routing (surfaces)

`src/surface.ts` classifies requests by hostname into three surfaces:

| Hostname                 | Surface | Serves                           |
| ------------------------ | ------- | -------------------------------- |
| `api.*.diplomacy.gg`     | `api`   | HTTP routes + Socket.IO upgrades |
| `admin.*.diplomacy.gg`   | `admin` | Bull Board + admin routes        |
| `localhost`, `127.0.0.1` | `dev`   | Both api + admin routes          |

Unknown hosts return 404 at the first middleware. `require-admin.ts` gates admin routes by email allowlist.

## Repositories

- **One file per table** under `src/repositories/`. Interface + factory pattern.
- **Repositories take a `DbClient`** (Drizzle) at construction. They don't import `db` directly — the service singleton
  does the wiring.
- **No business logic in repositories.** Reads/writes/upserts only. Branching + flow goes in route handlers.
- **Row shape via `@diplomacy/db`.** Example: `type UserRow = typeof users.$inferSelect`.

## Services (module singletons)

- **`src/services/db.ts`** holds the Drizzle client + per-table repositories. `initDb(createDbClient(DATABASE_URL))` at
  boot (and in test `setupTestServices()`).
- **`src/services/emails.ts`** holds the `AuthEmails` instance. `initEmails({...}, logger)` at boot; tests use
  `setEmails({...})` with a capturing sender.
- **Route handlers import `{ db, emails }` from services** — never construct repositories or email clients inline.

## Logging

- **`pino` + `pino-http`.** Request-scoped child loggers with `req_id`, `user_id`, `game_id`.
- **Never log passwords, codes, tokens.** Even in error paths. `pino.redact` covers common keys but don't test its
  coverage with plaintext secrets.
- **Don't `console.log`.** Use `logger.info` / `logger.error` / `logger.warn` — the structured output is what cloud
  tooling parses.

## Socket.IO

- **Mounted at `/socket.io/`** on the `api` surface only. `express-openapi-validator` doesn't see WS handshakes by
  design (it's mounted on `/api`).
- **Event types come from `@diplomacy/contracts`** (`packages/contracts/src/sockets/events.ts`).
- **Session is attached to the WS handshake** via `io.engine.use(sessionMiddleware)`. `socket.request.session` matches
  `req.session` from HTTP handlers.
- **Room joins authorized server-side**: on connection, verify the session's user is a `players` row for the game before
  `socket.join('game:<id>')`.
- **Transport is WebSocket only.** Polling fallback is disabled so the backend can scale replicas behind the Redis
  adapter without sticky sessions.

## Testing

- **Vitest + supertest.** Integration tests go through the full Express stack.
- **Setup/teardown.** `setupTestServices()` in `beforeAll`, `teardownTestServices()` in `afterAll`. Both from
  `src/test/db.ts`.
- **Unique data per test** via `makeTestCredentials()` — call it twice for tests needing two users, reuse specific
  fields for duplicate-detection tests.
- **Rate limits** reset per-test via `resetAuthRateLimits()` in `beforeEach`.
- **Real emails are captured** via `setEmails({ auth: createAuthEmails(capturingSender, ...) })` in `src/test/db.ts`.
  Assertions on email body / verify URL use the captured payload array.
- **Rows accumulate across runs locally.** CI uses ephemeral Postgres, so accumulation is irrelevant there.

## What not to do

- Don't mount `express-openapi-validator` outside `/api`. It would reject the `/socket.io/` handshake with 404 and break
  the WS upgrade.
- Don't construct a new DB client per handler. Use the service singleton.
- Don't branch the enumeration-safe 202 responses based on user state. The response must look identical for new /
  existing-unverified / existing-verified.
- Don't skip `session.regenerate()` on auth-state transitions. Session fixation is the attack class this prevents.
- Don't hand-write migrations. `pnpm --filter @diplomacy/db generate` reads the schema and writes the SQL.
