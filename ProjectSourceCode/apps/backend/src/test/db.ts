import { randomUUID } from 'node:crypto';

import { createDbClient, type DbClient } from '@diplomacy/db';
import { pino } from 'pino';

import { initDb, shutdownDb } from '../services/db.js';
import { initEmails } from '../services/emails.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  throw new Error('DATABASE_URL is required for tests. Start docker compose or set it manually.');
}

const silentLogger = pino({ level: 'silent' });

let client: DbClient | undefined;

/**
 * Initialize services against the real Postgres pointed at by DATABASE_URL.
 * Call once per test file in `beforeAll`; pair with `teardownTestServices` in
 * `afterAll` to close the connection pool.
 */
export function setupTestServices(): DbClient {
  client = createDbClient(databaseUrl!);
  initDb(client);
  initEmails(
    {
      // Unset so the sender logs instead of delivering during tests.
      resendApiKey: undefined,
      from: 'test@test.local',
      appUrl: 'http://localhost',
      codeExpiresInMinutes: 15,
    },
    silentLogger,
  );
  return client;
}

export async function teardownTestServices(): Promise<void> {
  await shutdownDb();
}

/**
 * Generates fresh unique credentials for a test. Tests that need two distinct
 * users call it twice. Tests that need duplicates deliberately reuse fields.
 * The randomized local parts keep tests parallel-safe against a shared DB.
 */
export function makeTestCredentials() {
  const id = randomUUID().slice(0, 8);
  return {
    email: `User-${id}@Test.Local`,
    username: `User_${id}`,
    password: 'correct-horse',
  };
}
