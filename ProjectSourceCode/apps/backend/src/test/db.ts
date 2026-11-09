import { randomUUID } from 'node:crypto';

import { createDbClient, type DbClient } from '@diplomacy/db';
import { pino } from 'pino';

import { VERIFICATION_CODE_TTL_MINUTES } from '../auth/verification-code.js';
import { createAuthEmails } from '../email/auth-emails.js';
import { type EmailPayload, type EmailSender } from '../email/sender.js';
import { initDb, shutdownDb } from '../services/db.js';
import { setEmails } from '../services/emails.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  throw new Error('DATABASE_URL is required for tests. Start docker compose or set it manually.');
}

const silentLogger = pino({ level: 'silent' });

let client: DbClient | undefined;

/** Call in beforeAll; pair with teardownTestServices in afterAll. */
export function setupTestServices(): DbClient {
  client = createDbClient(databaseUrl!);
  initDb(client);
  setEmails({
    auth: createAuthEmails(capturingSender, {
      appUrl: 'http://localhost',
      codeExpiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
    }),
  });
  return client;
}

export async function teardownTestServices(): Promise<void> {
  // Ignore the silent logger reference; vitest will tear the module down.
  silentLogger.level = 'silent';
  await shutdownDb();
}

/** Randomized per call, so tests run in parallel against a shared DB without collisions. */
export function makeTestCredentials() {
  const id = randomUUID().slice(0, 8);
  return {
    email: `User-${id}@Test.Local`,
    username: `User_${id}`,
    password: 'correct-horse',
  };
}

/** Reset per-test via `capturedEmails.length = 0`. */
export const capturedEmails: EmailPayload[] = [];

const capturingSender: EmailSender = {
  async send(payload) {
    capturedEmails.push(payload);
  },
};

export function lastCapturedEmail(): EmailPayload | undefined {
  return capturedEmails.at(-1);
}

export function extractCodeFromLastEmail(): string {
  const email = lastCapturedEmail();
  if (!email) {
    throw new Error('No email was captured');
  }
  const match = email.text.match(/\b(\d{6})\b/);
  if (!match?.[1]) {
    throw new Error('No 6-digit code found in captured email');
  }
  return match[1];
}
