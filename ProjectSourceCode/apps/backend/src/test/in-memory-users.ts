import { randomUUID } from 'node:crypto';

import { type UserRepository, type UserWithCredentials } from '../repositories/users.js';

/** UserRepository backed by a Map, for tests that shouldn't need Postgres. */
export function createInMemoryUserRepository(): UserRepository {
  const byEmail = new Map<string, UserWithCredentials>();
  return {
    async create({ email, passwordHash }) {
      if (byEmail.has(email)) {
        return null;
      }
      const user = { id: randomUUID(), email, passwordHash };
      byEmail.set(email, user);
      return { id: user.id, email: user.email };
    },
    async findByEmail(email) {
      return byEmail.get(email) ?? null;
    },
  };
}
