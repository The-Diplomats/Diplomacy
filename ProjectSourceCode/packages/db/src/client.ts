import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema/index.js';

export function createDbClient(connectionString: string) {
  if (!connectionString) {
    throw new Error('createDbClient: connectionString is required');
  }
  const pool = new pg.Pool({ connectionString });
  pool.on('error', (err) => {
    console.error('postgres pool error:', err);
  });
  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
