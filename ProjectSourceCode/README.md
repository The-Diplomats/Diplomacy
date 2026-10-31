# Diplomacy monorepo

pnpm workspace with all Diplomacy source code: apps (backend, worker, frontend) and shared libraries (game-types,
contracts, adjudicator, db).

## Prerequisites

- **Node 24** (see `.nvmrc` at repo root)
- **Corepack** (ships with Node, activate once with `corepack enable`)

Corepack reads the `packageManager` field in `package.json` and auto-fetches the pinned pnpm version. No global pnpm
install needed.

## First-time setup

```sh
pnpm install
pnpm -r build
```

`pnpm -r build` builds all packages in dependency order. Required on clean checkout before individual app commands work
(apps consume shared packages' compiled types).

If an app has a `.env.example`, copy it to `.env` before running the app's dev server. See each app's README for its
specific env vars.

## Day-to-day workflow

Run an app in dev mode (hot reload):

```sh
pnpm --filter backend dev
```

Rebuild a shared package after editing it:

```sh
pnpm --filter contracts build
```

Run tests across all workspaces:

```sh
pnpm -r test
```

Lint and format:

```sh
pnpm lint
pnpm format:check
```

Full rebuild (after pulling significant changes):

```sh
pnpm -r build
```

## Workspace layout

| Path                   | Role                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `apps/backend`         | HTTP API server (Express 5)                                   |
| `apps/worker`          | Background job consumer (BullMQ) _(planned)_                  |
| `apps/frontend`        | React + Vite SPA _(planned)_                                  |
| `packages/game-types`  | Shared domain types (pure TS)                                 |
| `packages/contracts`   | OpenAPI spec + generated typed client + Socket.IO event types |
| `packages/adjudicator` | Pure-function Diplomacy adjudicator + DATC tests              |
| `packages/db`          | Drizzle schema + typed client factory + migrations            |

Apps consume libraries via `workspace:^` dependencies. Each package has its own README with specifics.

## Package naming

- **Libraries** (`packages/*`): scoped `@diplomacy/<name>`. Imported: `import { ... } from '@diplomacy/game-types'`.
- **Apps** (`apps/*`): unscoped `<name>` (e.g., `backend`). Invoked via pnpm CLI, not imported from.

## Common pnpm patterns

```sh
pnpm --filter <name> <script>       # run <script> in one workspace
pnpm --filter <name>... <script>    # run in <name> AND its workspace deps (dep order)
pnpm -r <script>                    # run across every workspace
pnpm -r --parallel <script>         # run across every workspace in parallel
```

The `...` suffix includes transitive workspace deps. Useful when building an app that needs shared libraries built
first.

## Git hooks

`.githooks/` at the repo root. Installed automatically on `pnpm install` via the `prepare` script.

| Hook         | What it does                                                         |
| ------------ | -------------------------------------------------------------------- |
| `commit-msg` | Enforces conventional-commit format via `commitlint`                 |
| `pre-commit` | Blocks direct commits to `main`, runs `lint-staged` on changed files |
| `pre-push`   | Runs `pnpm -r typecheck` before pushing                              |

Bypass intentional with `--no-verify` on `commit` or `push`.

## Where to look next

- Per-package READMEs for specifics (`packages/*/README.md`, `apps/*/README.md`)
- `../MilestoneSubmissions/DESIGN_DOC.md` for architecture and decisions
