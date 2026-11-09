import { randomUUID } from 'node:crypto';

import { createDbClient, users } from '@diplomacy/db';
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, test } from 'vitest';

import { createPlayerRepository } from './players.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for player repository tests');
}

const db = createDbClient(connectionString);
const players = createPlayerRepository(db);
const testUserIds: string[] = [];

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({ email: `${randomUUID()}@example.com` })
    .returning({ id: users.id });

  if (!user) {
    throw new Error('Failed to create test user');
  }

  testUserIds.push(user.id);
  return user.id;
}

afterAll(async () => {
  for (const id of testUserIds) {
    await db.delete(users).where(
      // Remove the test user and its player profile.
      // The foreign key cascades deletion to players.
      eq(users.id, id),
    );
  }
});

describe('player repository', () => {
  test('creates and retrieves a player by ID', async () => {
    const userId = await createTestUser();
    const username = `player_${randomUUID()}`;

    const created = await players.create({ userId, username });

    expect(created).not.toBeNull();
    expect(created?.id).toBeDefined();
    expect(created?.userId).toBe(userId);
    expect(created?.username).toBe(username);
    expect(created?.createdAt).toBeInstanceOf(Date);

    const found = await players.findById(created!.id);
    expect(found).toEqual(created);
  });

  test('retrieves a player by username', async () => {
    const userId = await createTestUser();
    const username = `player_${randomUUID()}`;

    const created = await players.create({ userId, username });
    const found = await players.findByUsername(username);

    expect(found).toEqual(created);
  });

  test('rejects duplicate usernames', async () => {
    const firstUserId = await createTestUser();
    const secondUserId = await createTestUser();
    const username = `player_${randomUUID()}`;

    const first = await players.create({
      userId: firstUserId,
      username,
    });

    const duplicate = await players.create({
      userId: secondUserId,
      username,
    });

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  test('rejects multiple profiles for the same user', async () => {
    const userId = await createTestUser();

    const first = await players.create({
      userId,
      username: `player_${randomUUID()}`,
    });

    const duplicate = await players.create({
      userId,
      username: `player_${randomUUID()}`,
    });

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  test('returns null for unknown players', async () => {
    expect(await players.findById(randomUUID())).toBeNull();
    expect(await players.findByUsername(`missing_${randomUUID()}`)).toBeNull();
  });
});
