import { randomUUID } from 'node:crypto';

import { createDbClient, games, users } from '@diplomacy/db';
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
const testGameIds: string[] = [];

async function createTestUser() {
  const uid = randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ email: `test-${uid}@test.local`, username: `test_${uid}` })
    .returning({ id: users.id });

  if (!user) {
    throw new Error('Failed to create test user');
  }

  testUserIds.push(user.id);
  return user.id;
}

async function createTestGame() {
  const [game] = await db.insert(games).values({}).returning({ id: games.id });

  if (!game) {
    throw new Error('Failed to create test game');
  }

  testGameIds.push(game.id);
  return game.id;
}

afterAll(async () => {
  // Games cascade to their player seats; users cascade to their own seats.
  for (const id of testGameIds) {
    await db.delete(games).where(eq(games.id, id));
  }
  for (const id of testUserIds) {
    await db.delete(users).where(eq(users.id, id));
  }
});

describe('player repository', () => {
  test('seats a human player in a game', async () => {
    const gameId = await createTestGame();
    const userId = await createTestUser();

    const seat = await players.addSeat({ gameId, userId });

    expect(seat).not.toBeNull();
    expect(seat?.gameId).toBe(gameId);
    expect(seat?.userId).toBe(userId);
    expect(seat?.isAi).toBe(false);
    expect(seat?.power).toBeNull();
  });

  test('rejects a user holding two seats in the same game', async () => {
    const gameId = await createTestGame();
    const userId = await createTestUser();

    const first = await players.addSeat({ gameId, userId });
    const duplicate = await players.addSeat({ gameId, userId });

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  test('allows multiple AI seats in the same game (null user_ids are distinct)', async () => {
    const gameId = await createTestGame();

    const first = await players.addSeat({ gameId, userId: null, isAi: true });
    const second = await players.addSeat({ gameId, userId: null, isAi: true });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
  });

  test('rejects two seats with the same power in a game', async () => {
    const gameId = await createTestGame();
    const userA = await createTestUser();
    const userB = await createTestUser();

    const first = await players.addSeat({ gameId, userId: userA, power: 'england' });
    const duplicate = await players.addSeat({ gameId, userId: userB, power: 'england' });

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
  });

  test('lists every seat in a game', async () => {
    const gameId = await createTestGame();
    const userId = await createTestUser();
    await players.addSeat({ gameId, userId });
    await players.addSeat({ gameId, userId: null, isAi: true });

    const seats = await players.findByGame(gameId);
    expect(seats).toHaveLength(2);
  });

  test('deletes seats when their game is deleted (cascade)', async () => {
    const gameId = await createTestGame();
    const userId = await createTestUser();
    await players.addSeat({ gameId, userId });

    await db.delete(games).where(eq(games.id, gameId));

    const seats = await players.findByGame(gameId);
    expect(seats).toHaveLength(0);
  });
});
