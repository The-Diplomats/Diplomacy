import { type DbClient } from '@diplomacy/db';

import { createUserRepository, type UserRepository } from '../repositories/users.js';

export interface Db {
  users: UserRepository;
}

// Live binding: handlers import `db` and see whatever `initDb` set.
// `initDb` must be called once at app boot before any handler runs.
export let db: Db;

let _client: DbClient | undefined;

export function initDb(client: DbClient): void {
  _client = client;
  db = {
    users: createUserRepository(client),
  };
}

export async function shutdownDb(): Promise<void> {
  await _client?.$client.end();
}
