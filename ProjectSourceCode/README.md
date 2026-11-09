# Diplomacy monorepo

pnpm workspace with all Diplomacy source: apps (backend, worker, frontend) and shared libraries (game-types, contracts,
queues, adjudicator, db).

## Prerequisites

- **Node 24** (see `.nvmrc` at repo root)
- **Corepack**: ships with Node, enable once with `corepack enable`
- **Docker Desktop** running before `pnpm dev`

Corepack reads the `packageManager` field in `package.json` and auto-fetches the pinned pnpm version. No global pnpm
install needed.

## Quickstart

```sh
pnpm install
pnpm dev
```

`pnpm dev` runs three lanes via `concurrently`:

- **compose**: `docker compose up --build` (postgres + redis + migrator + backend + worker)
- **packages**: tsc watchers for all shared packages
- **frontend**: Vite dev server on the host at `http://localhost:5173`

Backend on `http://localhost:3001`, postgres `5432`, redis `6379`. First compose run builds images; later starts are
instant. `--kill-others-on-fail` tears down all three lanes together if any one dies.

Edit any `apps/*/src/*`: tsx reloads inside the container. Edit any `packages/*/src/*`: host tsc rebuilds dist, the
bind-mount propagates into the container, tsx reloads. Zero manual steps.

## Dev accounts (local only)

The `seeder` compose service inserts five pre-verified teammate accounts on `pnpm dev` / `docker compose up`. All share
the same password so you can log in without running the verify-email flow. Login accepts either the email or the
username as the identifier.

| Identifier                          | Password               |
| ----------------------------------- | ---------------------- |
| `rez@diplomacy.gg` (or `rez`)       | `diplomacy-dev-shared` |
| `brynne@diplomacy.gg` (or `brynne`) | `diplomacy-dev-shared` |
| `justin@diplomacy.gg` (or `justin`) | `diplomacy-dev-shared` |
| `nabl@diplomacy.gg` (or `nate`)     | `diplomacy-dev-shared` |
| `deven@diplomacy.gg` (or `deven`)   | `diplomacy-dev-shared` |

The seed script refuses to run when `NODE_ENV=production`; cloud envs never get these accounts.

To exercise the register / verify / password-reset flows, register a fresh email instead. With `RESEND_API_KEY` unset
(the local default), codes print to the backend logs: `docker compose logs backend`.

## VS Code

On first open, click yes to "Would you like to use the workspace's version of TypeScript?" so IDE diagnostics match CLI
output. The prompt is wired via `.vscode/settings.json`; other editors can ignore it.

## Stack commands

```sh
pnpm dev                          # start the stack (compose + host watchers)
pnpm down                         # stop and remove containers (keep postgres volume)
pnpm nuke                         # stop and remove containers + wipe postgres volume
docker compose logs -f backend    # follow backend logs
docker compose restart backend    # restart one service without rebuilding
```

**`Ctrl+C` on `pnpm dev`**: stops the containers but keeps them around (visible in `docker ps -a`). Next `pnpm dev`
resumes them, fast.

**`pnpm down`**: stops AND removes the containers + the compose network. Postgres volume (DB data) is preserved. Use
this after editing `docker-compose.yaml` or `apps/*/Dockerfile` so the next `pnpm dev` creates fresh containers with the
new config.

**`pnpm nuke`**: everything `pnpm down` does, plus deletes the postgres volume. Next `pnpm dev` starts with an empty
database. Use for schema reset or when you suspect corrupt DB state.

For infra-only mode (run backend/worker on host with native debugger attach):

```sh
docker compose up -d postgres redis
# Ensure apps/backend/.env (or apps/worker/.env) exists with DATABASE_URL, REDIS_URL,
# SESSION_SECRET, FRONTEND_ORIGINS matching the compose services.
pnpm --filter backend dev
```

## Testing + linting (host)

```sh
pnpm -r test                      # all packages (worker tests need REDIS_URL)
pnpm --filter backend test        # one package
pnpm lint
pnpm format:check
```

## Workspace layout

| Path                   | Role                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `apps/backend`         | HTTP API server (Express 5)                                   |
| `apps/worker`          | Background job consumer (BullMQ)                              |
| `apps/frontend`        | React 19 + Vite SPA (Tailwind v4 + shadcn/ui)                 |
| `packages/game-types`  | Shared domain types (pure TS)                                 |
| `packages/contracts`   | OpenAPI spec + generated typed client + Socket.IO event types |
| `packages/queues`      | Shared BullMQ queue definitions and typed job payloads        |
| `packages/adjudicator` | Pure-function Diplomacy adjudicator + DATC tests              |
| `packages/db`          | Drizzle schema + typed client factory + migrations            |

Apps consume libraries via `workspace:^` dependencies. Each package has its own README with specifics.

Naming: libraries are scoped (`@diplomacy/<name>`, imported). Apps are unscoped (`backend`, `worker`, invoked via pnpm
CLI).

## pnpm filter patterns

```sh
pnpm --filter <name> <script>       # one workspace
pnpm --filter <name>... <script>    # workspace + its deps (dep order)
pnpm -r <script>                    # all workspaces
```

## Git hooks

`.githooks/` at the repo root. Installed automatically on `pnpm install` via the `prepare` script.

| Hook         | What it does                                                         |
| ------------ | -------------------------------------------------------------------- |
| `commit-msg` | Enforces conventional-commit format via `commitlint`                 |
| `pre-commit` | Blocks direct commits to `main`, runs `lint-staged` on changed files |
| `pre-push`   | Runs `pnpm -r typecheck` before pushing                              |

Bypass intentional with `--no-verify` on `commit` or `push`.

## Troubleshooting

- **Ports in use (5432/6379/3001)**: stop local postgres/redis/dev-server instances, or change the compose port
  mappings.
- **"Cannot connect to Docker daemon"** / **`dial unix /…/docker.sock: no such file`**: start Docker Desktop, then
  re-run `pnpm dev`. The compose lane's death also kills the other lanes via `--kill-others-on-fail`.
- **Stale state after schema change**: `pnpm nuke && pnpm dev` for a clean DB.

## Where to look next

- Per-package READMEs for specifics (`packages/*/README.md`, `apps/*/README.md`)
- `../MilestoneSubmissions/DESIGN_DOC.md` for architecture and decisions
