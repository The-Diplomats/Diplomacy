import { randomUUID } from 'node:crypto';

import { type DbClient, games, users } from '@diplomacy/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { setupTestServices, teardownTestServices } from '../test/db.js';
import { createGameRepository, type GameRepository } from './games.js';

let db: DbClient;
let repo: GameRepository;
const testUserIds: string[] = [];
const testGameIds: string[] = [];

beforeAll(() => {
  db = setupTestServices();
  repo = createGameRepository(db);
});

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

afterAll(async () => {
  for (const id of testGameIds) {
    await db.delete(games).where(eq(games.id, id));
  }
  for (const id of testUserIds) {
    await db.delete(users).where(eq(users.id, id));
  }
  await teardownTestServices();
});

describe('game repository', () => {
  test('creates a game with defaults', async () => {
    const userId = await createTestUser();

    const game = await repo.create({ name: 'Autumn 1901', createdByUserId: userId });
    testGameIds.push(game.id);

    expect(game.name).toBe('Autumn 1901');
    expect(game.status).toBe('forming');
    expect(game.createdByUserId).toBe(userId);
    expect(game.movementDeadlineSeconds).toBe(86400);
    expect(game.maxAiPowers).toBe(4);
    expect(game.startedAt).toBeNull();
    expect(game.finishedAt).toBeNull();
    expect(game.createdAt).toBeInstanceOf(Date);
  });

  test('creates a game with overridden deadline and AI cap', async () => {
    const userId = await createTestUser();

    const game = await repo.create({
      name: 'Blitz',
      createdByUserId: userId,
      movementDeadlineSeconds: 3600,
      maxAiPowers: 2,
    });
    testGameIds.push(game.id);

    expect(game.movementDeadlineSeconds).toBe(3600);
    expect(game.maxAiPowers).toBe(2);
  });

  test('retrieves a game by id', async () => {
    const userId = await createTestUser();
    const created = await repo.create({ name: 'Classic', createdByUserId: userId });
    testGameIds.push(created.id);

    const found = await repo.findById(created.id);
    expect(found).toEqual(created);
  });

  test('returns null for unknown game id', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  test('nulls created_by_user_id when the creator is deleted (SET NULL)', async () => {
    const userId = await createTestUser();
    const game = await repo.create({ name: 'Orphaned', createdByUserId: userId });
    testGameIds.push(game.id);

    await db.delete(users).where(eq(users.id, userId));
    testUserIds.splice(testUserIds.indexOf(userId), 1);

    const found = await repo.findById(game.id);
    expect(found).not.toBeNull();
    expect(found?.createdByUserId).toBeNull();
  });
});
