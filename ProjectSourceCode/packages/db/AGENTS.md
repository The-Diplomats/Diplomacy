# AGENTS.md — packages/db

Single source of truth for the Postgres schema. Drizzle ORM, drizzle-kit for migration generation, typed row inference
for consumers. Read `ProjectSourceCode/AGENTS.md` for monorepo rules first.

## Layout

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── index.ts            # re-exports every table + relation
│   │   ├── users.ts
│   │   ├── players.ts
│   │   ├── session.ts          # managed by connect-pg-simple
│   │   └── verification-tokens.ts
│   ├── client.ts               # createDbClient(url) factory
│   └── index.ts                # re-exports schema + client
├── migrations/
│   ├── generated/              # drizzle-kit output; committed; never hand-edit
│   └── README.md
└── drizzle.config.ts
```

## Adding a new table

1. **Create `src/schema/<name>.ts`** with the Drizzle table definition. Export the table plus
   `type XxxRow = typeof xxx.$inferSelect` and `type XxxInsert = typeof xxx.$inferInsert`.
2. **Re-export from `src/schema/index.ts`** so consumers can `import { games } from '@diplomacy/db'`.
3. **Generate the migration**: `pnpm --filter @diplomacy/db generate`. Reads the schema diff, writes a new SQL file to
   `migrations/generated/`.
4. **Commit both** the schema file and the generated SQL in the same PR. Reviewer sees the intent (schema) and the
   applied change (SQL) together.
5. **Never hand-edit `migrations/generated/`.** If the generated output is wrong, fix the schema and regenerate.

## Schema conventions

- **One table per file** under `src/schema/`. Readable from the file tree; small files diff cleanly.
- **Table names: plural snake_case** (`users`, `verification_tokens`). Column names: snake_case (`email_verified_at`).
  Drizzle maps snake_case columns to camelCase TS fields automatically when you define them that way.
- **Primary keys: UUID v4** via `uuid('id').primaryKey().defaultRandom()`. No serial / auto-increment integers
  (predictable IDs leak enumeration + race-on-swap during tests).
- **Timestamps: `timestamp('...', { withTimezone: true })`**. Never `timestamp()` without timezone — Postgres stores the
  latter as "naive" and causes DST bugs.
- **Nullability is explicit.** `.notNull()` is default-off. State your intent.
- **Foreign keys always declare `onDelete`.** Pick `cascade` (dependent rows go with the parent), `set null` (dependent
  rows survive but lose the ref), or `restrict` (parent can't be deleted while dependents exist). Default `no action` is
  almost never what you want.
- **Unique constraints: use `uniqueIndex` with a `sql`\\`\\` expression for case-insensitivity.** See `users.ts` for
  `users_email_lower_idx` / `users_username_lower_idx`. App normalizes on write; the functional index enforces it even
  if a code path forgets.

## Indexing

- **Index foreign keys** that participate in joins. Drizzle doesn't create these automatically.
- **Index columns used in `WHERE` on high-cardinality tables.** Low-volume tables (<10k rows) don't need indexes beyond
  PK + FK.
- **Composite indexes follow column order of the queries.** `(game_id, phase_id)` beats `(phase_id, game_id)` if you
  always filter by game first.
- **Functional indexes for case-folded lookups.** `sql`lower(${table.username})\\` for username lookups; matches the
  query shape.

## Relations

- **Declare `relations()` in the table file** (or in `src/schema/index.ts` if it spans multiple tables). Enables
  `db.query.users.findFirst({ with: { player: true } })` eager-loading.
- **Prefer explicit `db.select().from(...).innerJoin(...)` for anything beyond a single eager load.** More readable,
  more performant, more predictable than deeply-nested `with: {}`.

## Client usage

Consumers (backend, worker, scripts) use the factory, not a module-singleton:

```ts
import { createDbClient } from '@diplomacy/db';
const db = createDbClient(process.env.DATABASE_URL!);
```

Each app wires its own singleton via its service layer (see `apps/backend/src/services/db.ts`). The factory makes test
isolation + multi-env easier than a module-level `db` export.

## Migrations in CI/CD

- **Run via `pnpm --filter @diplomacy/db migrate`** against Neon's _direct_ (non-pooled) URL. pgBouncer transaction-mode
  breaks advisory locks + transactional DDL.
- **Executed by `migrate.yml`** as a reusable workflow before every ACA deploy. Creates a Neon branch
  `pre-migration-{sha}` first; on failure promotes the branch back. See `DESIGN_DOC.md` §13.
- **Never run migrations from the running backend/worker process.** The schema-mutation privilege lives only in the
  migrate step.

## Testing + seeding

- **Repository tests live in `apps/backend/src/repositories/*.test.ts`.** They hit a real Postgres via
  `setupTestServices()` from `apps/backend/src/test/db.ts`.
- **Don't write seed data here.** Dev-bootstrap seed is at `apps/backend/src/scripts/seed.ts`; E2E scenarios go in
  `apps/backend/src/scripts/scenarios/`. See `DESIGN_DOC.md` §6.

## What not to do

- Don't hand-write SQL migrations. Use `pnpm --filter @diplomacy/db generate`.
- Don't hand-edit files under `migrations/generated/`. Fix the schema and regenerate.
- Don't use `timestamp()` without `{ withTimezone: true }`.
- Don't use serial integer PKs. UUIDs.
- Don't omit `onDelete`. State your cascade intent explicitly.
- Don't define schema outside `src/schema/`. The directory is the source of truth that drizzle-kit reads.
- Don't export a module-level `db` instance from this package. The factory is the public API; consumers own the
  singleton lifecycle.
