# @diplomacy/db

Drizzle schema (single source of truth for DB tables) + typed client factory + generated migrations.

## Usage

```ts
import { createDbClient, users, games } from '@diplomacy/db';

const db = createDbClient(process.env.DATABASE_URL!);
const allUsers = await db.select().from(users);
```

## Structure

- `src/schema/*.ts`: one file per table (plus any shared enums)
- `src/client.ts`: `createDbClient(connectionString)` factory
- `migrations/generated/`: Drizzle-managed SQL + metadata (see `migrations/README.md` before touching)
