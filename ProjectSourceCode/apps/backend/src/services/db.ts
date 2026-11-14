import { type DbClient } from '@diplomacy/db';

import { createMessageRepository, type MessageRepository } from '../repositories/messages.js';
import { createPlayerRepository, type PlayerRepository } from '../repositories/players.js';
import { createUserRepository, type UserRepository } from '../repositories/users.js';
import {
  createVerificationTokenRepository,
  type VerificationTokenRepository,
} from '../repositories/verification-tokens.js';

export interface Db {
  messages: MessageRepository;
  players: PlayerRepository;
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
    messages: createMessageRepository(client),
    players: createPlayerRepository(client),
    users: createUserRepository(client),
    verificationTokens: createVerificationTokenRepository(client),
  };
}

export async function shutdownDb(): Promise<void> {
  await _client?.$client.end();
}
