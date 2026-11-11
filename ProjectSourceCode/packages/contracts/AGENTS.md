# AGENTS.md — packages/contracts

OpenAPI 3.1 spec + Kubb-generated TanStack Query client + hand-written Socket.IO event types. The spec is the API
contract that both backend (via `express-openapi-validator`) and frontend (via Kubb hooks) are driven from. Read
`ProjectSourceCode/AGENTS.md` for monorepo rules first.

## Layout

```
packages/contracts/
├── api/
│   └── public/
│       └── openapi.yaml        # the source of truth
├── src/
│   ├── generated/              # Kubb output; committed; never hand-edit
│   ├── sockets/
│   │   └── events.ts           # hand-written Socket.IO event types
│   ├── spec.ts                 # loads the bundled spec for express-openapi-validator
│   └── index.ts                # re-exports generated types + socket events
├── kubb.config.ts              # codegen config
└── redocly.yaml                # spec lint config
```

## Adding an endpoint

The authoring workflow is strictly spec-first.

1. **Edit `api/public/openapi.yaml`** — append to existing sections, don't replace.
   - Add the tag under `tags:` (one tag per resource group: `Auth`, `Games`, `Phases`, ...)
   - Add the path under `paths:` using the OpenAPI path-template syntax (`/games/{id}`)
   - Add any new schemas under `components.schemas:` with `additionalProperties: false` and explicit `required:` lists
2. **Pick a stable `operationId`** — becomes the function + hook name in the Kubb output (`listGames` → `listGames()` +
   `useListGames()`). Prefer verbs: `listGames`, `createGame`, `getGame`, `updateOrders`.
3. **Regenerate the client**: `pnpm --filter @diplomacy/contracts build`. Writes TS types + fns + hooks to
   `src/generated/`.
4. **Commit the spec change and the regenerated output together.** Reviewer sees the contract intent (YAML) and the
   compile-time surface (TS) in one diff.
5. **Backend handler + frontend hook** both now typecheck against the same contract. See `apps/backend/AGENTS.md` for
   the handler side and `apps/frontend/AGENTS.md` for the client side.

## Spec conventions

- **Mount-relative paths.** The validator is mounted on `/api`, so spec paths omit that prefix: `/games/{id}` in the
  spec → `/api/games/123` on the wire. Kubb client sets its baseURL to `/api` to match.
- **Schemas close by default.** Every object schema uses `additionalProperties: false` and an explicit `required:` list.
  Open schemas leak accidentally-included fields.
- **Error responses use `ProblemDetails`** (RFC 7807 shape): `{ title, status, detail }`. One component schema,
  referenced from every non-2xx response.
- **Enumeration-safe endpoints return 202** with no body (`register`, `register/resend`, `password-reset`). The response
  shape is identical regardless of the account state; don't branch on it. See `apps/backend/AGENTS.md` for the
  auth-specific rationale.
- **Describe `summary` + `description` in English.** They show up in the generated docs; don't leave them blank.

## Breaking changes

- **The `compat-check.yml` workflow runs `oasdiff`** on every PR that touches `api/**`. Breaking changes fail the check
  without the `breaking-change-approved` PR label.
- **What counts as breaking:** removing paths / operations / required fields, adding required request fields, changing
  response shapes, tightening validation (e.g., adding `minLength` where none existed), removing enum values.
- **If the change is intentionally breaking**, apply the `breaking-change-approved` label. PR description should name
  the callers that will need updates.
- **Pre-release (nobody deployed yet) is a legitimate reason to break freely** — we did this during Session A. Just be
  honest about it in the PR body.

## Socket.IO event types

- **Hand-written in `src/sockets/events.ts`.** OpenAPI doesn't cover WebSocket events; we type them manually.
- **One interface per direction**: `ServerToClientEvents` + `ClientToServerEvents`. Both backend and frontend import
  them.
- **Payload shapes should re-use schema types from the generated OpenAPI output when relevant** (e.g., `phase:resolved`
  includes a board state that matches the REST `GET /games/:id/phases/current` response).

## Kubb configuration

- **Config lives at `kubb.config.ts`** at the package root.
- **Generators used**: `@kubb/plugin-oas`, `@kubb/plugin-ts` (types), `@kubb/plugin-client` (fetch fn),
  `@kubb/plugin-react-query` (TanStack Query hooks).
- **Don't add custom plugins** without discussion — Kubb's plugin order matters and misconfiguration often produces
  output that compiles but diverges from the spec at runtime.
- **Generated code lives in-repo** (`src/generated/`) so the diff is reviewable on every spec change. The
  `contract-check.yml` workflow regenerates and asserts the committed output matches.

## Redocly lint

- **`redocly lint`** runs in CI (and locally via `pnpm --filter @diplomacy/contracts lint`).
- **`redocly.yaml`** sets the rule set. Default: `recommended` with a few relaxations we agreed on.
- **Lint violations block the build.** Fix the spec, don't disable the rule.

## Versioning + release

- **The package itself is scoped `@diplomacy/contracts`** and bumps alongside the rest of the monorepo via
  release-please. No independent versioning.
- **The OpenAPI `info.version` is manually bumped** in the spec when we tag a release with API changes. Doesn't need to
  match the npm version 1:1; it's for documentation purposes.

## What not to do

- Don't hand-edit `src/generated/`. It's regenerated from the spec; your edit will be wiped on the next
  `pnpm --filter @diplomacy/contracts build`.
- Don't add OpenAPI endpoints that live outside `/api` (like `/socket.io/*`). The validator is mounted on `/api` only
  and the spec reflects that scope.
- Don't skip `additionalProperties: false`. Open schemas leak fields the backend didn't intend to expose.
- Don't use inline schemas for anything referenced more than once. Pull into `components.schemas:` so a future rename
  doesn't require editing every operation.
- Don't break the contract silently — if the change is breaking, apply the `breaking-change-approved` label;
  `compat-check.yml` will flag it anyway.
- Don't add a `GET /__debug` or `/admin/*` to the public spec. Admin routes live on the `admin` surface; see
  `apps/backend/AGENTS.md`.
