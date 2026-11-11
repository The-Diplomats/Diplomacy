# AGENTS.md — ProjectSourceCode (pnpm monorepo)

Rules that apply across every workspace. App-specific rules live in `apps/<app>/AGENTS.md`.

## TypeScript

- **Strict mode is non-negotiable.** `tsconfig.base.json` sets `strict: true`. Don't disable rules file-by-file.
- **No `any`.** If you need to escape the type system, use `unknown` + a narrowing guard, or fix the type. `any` is
  review-blocked.
- **No single-char identifiers.** Default to full words (`province`, `response`, `event`). Not a lint rule —
  self-enforced.
- **Imports use ESM paths with `.js` extension** even in `.ts` files (NodeNext resolution). Example:
  `import { db } from '../../../services/db.js'`.
- **Shared types come from workspace packages**, not duplicated. If a type is used in >1 workspace, it belongs in
  `packages/game-types`, `packages/contracts`, or `@diplomacy/db`.

## Dependencies + the catalog

- **New deps go through the pnpm catalog** (`pnpm-workspace.yaml`) when they're used in >1 workspace. Add once,
  reference as `"react": "catalog:"` in each `package.json`.
- **App-only deps stay in the app's `package.json`.** Backend-only wrappers (Express middleware, Drizzle plugins) don't
  belong in the catalog.
- **Check the catalog before adding.** React, TypeScript, Vitest, ESLint, Prettier, and other shared versions live
  there. Don't pin them in individual `package.json` files.

## OpenAPI contract-first

The spec at `packages/contracts/api/public/openapi.yaml` is **the** API contract. Both the backend (via
`express-openapi-validator`) and the frontend (via Kubb-generated client) are driven from it.

- **Add the endpoint to the spec first**, regenerate the client (`pnpm --filter @diplomacy/contracts build`), then write
  the handler. The compiler will enforce the response shape via `@diplomacy/contracts` types.
- **Never hand-edit `packages/contracts/src/generated/`** — it's regenerated from the spec.
- **Breaking changes** need the `breaking-change-approved` PR label.
- The validator wraps the API surface routes only. The Socket.IO handshake at `/socket.io/` is a separate surface and
  intentionally outside the validator's scope. The `/api` prefix some URLs use is a frontend+Vite-proxy convention, not
  a backend mount path — see `packages/contracts/AGENTS.md` for the full explanation.

## Database (Drizzle)

- **One table per file under `packages/db/src/schema/`.** Example: `users.ts`, `players.ts`, `verification-tokens.ts`.
- **All schema changes go through `pnpm --filter @diplomacy/db generate`** to produce a migration file in
  `migrations/generated/`. Commit the generated SQL alongside the schema change.
- **Query via the typed builder**, not raw SQL. `db.select().from(games).where(eq(games.id, id))`. Only use `sql` tagged
  templates for things Drizzle can't express (functional indexes, window functions).
- **Import types from `@diplomacy/db`** — never redefine them: `type UserRow = typeof users.$inferSelect`.

## Testing (Vitest, uniform)

- **One framework across the monorepo.** No Mocha, no Jest.
- **Integration tests hit a real Postgres** via `DATABASE_URL`. See `apps/backend/src/test/db.ts` for the setup helpers.
- **Per-test unique data** via `makeTestCredentials()` + friends. Don't share rows between tests. Don't truncate between
  runs — rows accumulate; CI uses ephemeral Postgres.
- **E2E scenarios live in `apps/backend/src/scripts/scenarios/`** and are invoked via
  `pnpm --filter backend seed:scenario <name>`. Upsert on stable UUIDs for idempotency. Drizzle, not raw SQL. See
  `DESIGN_DOC.md` §6 for the full test data strategy.
- **Authentication in tests is always real** — never write session rows directly. Use the auth helpers that do real
  login.

## pnpm filter patterns

```sh
pnpm --filter backend <script>          # one workspace by name
pnpm --filter backend... <script>       # workspace + its deps (dep order)
pnpm --filter '@diplomacy/*' <script>   # all scoped packages
pnpm -r <script>                        # every workspace
```

## Comments

- **Default to no comments.** Well-named identifiers already explain what. Only add a comment when the _why_ is
  non-obvious: a hidden constraint, a workaround, a bug reference.
- **No "this file does X" headers**, no "added for the Y flow" comments, no re-stating what the code does. Those belong
  in the PR description and rot fast.
- **No forward-looking narrative in READMEs.** Document what exists now, not plans or chat-tone future tense.

## Formatting

- **Prettier runs via `lint-staged`** on commit. Don't fight the formatter — if a line looks wrong, it's probably
  correct.
- **Braces on guard clauses; single-line OK for non-guards.** Any `if` body that `return`s or `throw`s uses braces —
  even on one line — so a later edit can't accidentally pull a statement into or out of the guard. Non-exiting `if`
  bodies can stay single-line.
  ```ts
  // Guard clauses: braces required
  if (!user) {
    return null;
  }
  if (bad) {
    throw new Error('bad');
  }

  // Non-guards: single-line fine
  if (verbose) logger.info('ok');
  if (count) total += count;

  // Multi-line bodies always use braces (guard or not)
  if (foo) {
    doSomething();
    doAnother();
  }
  ```
- **No em dashes.** Use colons, periods, or restructure. Team preference.

## Environment variables

- **Backend `.env` is strict** — missing required vars cause startup failure with a clear error. Add new vars to
  `.env.example` whenever you add them to code.
- **Cloud envs use GH environment secrets**, not `.env` files. Dev/stage/prod are separately scoped.
- **Never commit `.env`.** `.gitignore` covers it; don't override.

## Naming

- **Apps are unscoped**: `backend`, `worker`, `frontend` — invoked via `pnpm --filter backend`.
- **Packages are scoped**: `@diplomacy/db`, `@diplomacy/contracts` — imported.
- **Routes are kebab-case** on the wire (`/auth/password-reset/verify`), camelCase in TS (`passwordResetVerifyRouter`).
- **DB columns are snake_case** (`email_verified_at`); the Drizzle schema maps them to camelCase in TS
  (`emailVerifiedAt`).

## When adding a new workspace

- Create `packages/<name>/` or `apps/<name>/` with its own `package.json`, `tsconfig.json`, `src/index.ts`.
- Add to the appropriate glob in `pnpm-workspace.yaml` (already covers `apps/*` and `packages/*`).
- If it's a library, scope the name: `@diplomacy/<name>`.
- Add a brief README describing the role.

## What not to do

- Don't add a new testing framework. Vitest only.
- Don't add a new HTTP framework. Express 5 only.
- Don't add a new state library. TanStack Query for server state, Zustand for client state.
- Don't introduce lodash/underscore. Native + small focused deps.
- Don't write SQL migrations by hand. Use `drizzle-kit generate`.
- Don't bypass `express-openapi-validator` by mounting outside `/api`.
