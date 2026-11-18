import { randomUUID } from 'node:crypto';

import { type DbClient, users } from '@diplomacy/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { verifyPassword } from '../../auth/password.js';
import { makeTestCredentials, setupTestServices, teardownTestServices } from '../../test/db.js';
import { upsertVerifiedUser } from './users.js';

describe('upsertVerifiedUser', () => {
  let db: DbClient;

  beforeAll(() => {
    db = setupTestServices();
  });
  afterAll(teardownTestServices);

  test('creates a verified user on its stable id, and a rerun resets the password', async () => {
    const { email, username } = makeTestCredentials();
    const user = { id: randomUUID(), email: email.toLowerCase(), username };

    await upsertVerifiedUser(db, user, 'first-password-0123');
    await upsertVerifiedUser(db, user, 'second-password-0123');

    const rows = await db.select().from(users).where(eq(users.id, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.emailVerifiedAt).not.toBeNull();
    expect(await verifyPassword('second-password-0123', rows[0]!.passwordHash!)).toBe(true);
  });

  test('refuses when another account already holds the email or username', async () => {
    const { email, username } = makeTestCredentials();
    const existing = { id: randomUUID(), email: email.toLowerCase(), username };
    await upsertVerifiedUser(db, existing, 'first-password-0123');

    const sameEmail = { ...existing, id: randomUUID(), username: `${username}_x` };
    const sameUsername = {
      id: randomUUID(),
      email: `x-${existing.email}`,
      username: username.toUpperCase(),
    };

    await expect(upsertVerifiedUser(db, sameEmail, 'other-password-0123')).rejects.toThrow(
      existing.id,
    );
    await expect(upsertVerifiedUser(db, sameUsername, 'other-password-0123')).rejects.toThrow(
      existing.id,
    );
  });
});
