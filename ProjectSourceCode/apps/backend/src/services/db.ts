import { type DbClient } from '@diplomacy/db';

import { createUserRepository, type UserRepository } from '../repositories/users.js';
import {
  createVerificationTokenRepository,
  type VerificationTokenRepository,
} from '../repositories/verification-tokens.js';

export interface Db {
  users: UserRepository;
  verificationTokens: VerificationTokenRepository;
}

// Live binding: handlers import `db` and see whatever `initDb` set.
// `initDb` must be called once at app boot before any handler runs.
export let db: Db;

let _client: DbClient | undefined;

export function initDb(client: DbClient): void {
  _client = client;
  db = {
    users: createUserRepository(client),
    verificationTokens: createVerificationTokenRepository(client),
  };
}

export async function shutdownDb(): Promise<void> {
  await _client?.$client.end();
}
