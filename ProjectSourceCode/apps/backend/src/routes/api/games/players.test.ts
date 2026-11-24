import { randomUUID } from 'node:crypto';

import { type DbClient, games } from '@diplomacy/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { resetAuthRateLimits } from '../../../middleware/auth-rate-limits.js';
import { createPlayerRepository } from '../../../repositories/players.js';
import {
  createTestApp,
  httpsClient,
  registerAndVerify,
  type TestApp,
} from '../../../test/auth-client.js';
import {
  capturedEmails,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../../../test/db.js';

let db: DbClient;
let instance: TestApp;
const testGameIds: string[] = [];

beforeAll(() => {
  db = setupTestServices();
  instance = createTestApp();
});

beforeEach(() => {
  capturedEmails.length = 0;
  resetAuthRateLimits();
});

afterAll(async () => {
  for (const id of testGameIds) {
    await db.delete(games).where(eq(games.id, id));
  }
  await teardownTestServices();
});

async function createTestGame(): Promise<string> {
  const [game] = await db
    .insert(games)
    .values({ name: `test_${randomUUID().slice(0, 8)}` })
    .returning({ id: games.id });
  if (!game) {
    throw new Error('Test game creation failed!');
  }
  testGameIds.push(game.id);
  return game.id;
}

/* Registers a new user and signs them in */
async function signedInUser() {
  const client = await registerAndVerify(instance, makeTestCredentials());
  const me = await client.get('/auth/me');
  return { client, userId: me.body.id as string, username: me.body.username as string };
}

async function seat(gameId: string, userId: string): Promise<string> {
  const row = await createPlayerRepository(db).addSeat({ gameId, userId, isAi: userId === null });
  if (!row) {
    throw new Error('Unable to set test player');
  }
  return row.id;
}

describe('GET /games/:gameId/players', () => {
  test('lists every seat in join order, with usernames and null username for AI', async () => {
    const gameId = await createTestGame();
    const bob = await signedInUser();
    const noah = await signedInUser();
    const bobId = await seat(gameId, bob.userId);
    const noahId = await seat(gameId, noah.userId);
    const aiId = await seat(gameId, null);

    const res = await bob.client.get(`/games/${gameId}/players`);

    expect(res.status).toBe(200);
    expect(res.body.players).toEqual([
      {
        id: bobId,
        userId: bob.userId,
        username: bob.username,
        power: null,
        isAi: false,
        afkCounter: 0,
        locked: false,
      },
      {
        id: noahId,
        userId: noah.userId,
        username: noah.username,
        power: null,
        isAi: false,
        afkCounter: 0,
        locked: false,
      },
      {
        id: aiId,
        userId: null,
        username: null,
        power: null,
        isAi: true,
        afkCounter: 0,
        locked: false,
      },
    ]);
  });

  test("doesn't include players from other games", async () => {
    const gameA = await createTestGame();
    const gameB = await createTestGame();
    const bob = await signedInUser();
    const noah = await signedInUser();
    await seat(gameA, bob.userId);
    await seat(gameB, noah.userId);

    const res = await bob.client.get(`/games/${gameA}/players`);

    expect(res.status).toBe(200);
    expect(res.body.players).toHaveLength(1);
    expect(res.body.players[0].userId).toBe(bob.userId);
  });

  test('rejects a request with no session', async () => {
    const gameId = await createTestGame();

    const res = await httpsClient(instance).get(`/games/${gameId}/players`);

    expect(res.status).toBe(401);
  });

  test('rejects a user not seated in the game', async () => {
    const gameId = await createTestGame();
    const bob = await signedInUser();
    const whoisthis = await signedInUser();
    await seat(gameId, bob.userId);

    const res = await whoisthis.client.get(`/games/${gameId}/players`);

    expect(res.status).toBe(403);
  });
});
