# Postgres database migrations

Drizzle-generated SQL that evolves the Postgres schema. The `generated/` folder is managed by `drizzle-kit`.

Do not manually edit files in `generated/`.

## Workflow

To change the schema:

1. Edit `src/schema/*.ts`
2. `pnpm --filter @diplomacy/db run generate` from `ProjectSourceCode/`
3. Commit the schema change + the new generated migration
