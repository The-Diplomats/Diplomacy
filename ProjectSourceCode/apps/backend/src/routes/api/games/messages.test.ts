import { randomUUID } from 'node:crypto';

import type { Message } from '@diplomacy/contracts';
import { type DbClient, games, messages } from '@diplomacy/db';
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

async function seatPlayer(gameId: string, userId: string): Promise<string> {
  const row = await createPlayerRepository(db).addSeat({ gameId, userId });
  if (!row) {
    throw new Error('Unable to set test user!');
  }
  return row.id;
}

describe('POST /games/:gameId/messages', () => {
  // This one tests if the message saves and also ensures that whitespace before/after the message is properly trimmed.
  test('save a message and return it and sender info', async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();
    const playerId = await seatPlayer(gameId, user.userId);

    const res = await user.client.post(`/games/${gameId}/messages`, {
      text: '  Whats up this is a test message  ',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      gameId,
      fromPlayerId: playerId,
      fromUsername: user.username,
      fromPower: null,
      toPlayerId: null,
      text: 'Whats up this is a test message',
    });
  });

  test("don't allow message creation without a session", async () => {
    const gameId = await createTestGame();

    const res = await httpsClient(instance).post(`/games/${gameId}/messages`, {
      text: ' this should not work ',
    });

    expect(res.status).toBe(401);
  });

  test("don't allow a user that isn't in the game", async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();

    const res = await user.client.post(`/games/${gameId}/messages`, {
      text: ' I am not in this game',
    });

    expect(res.status).toBe(403);
  });

  test("don't allow text that is only whitespace", async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();
    await seatPlayer(gameId, user.userId);

    const res = await user.client.post(`/games/${gameId}/messages`, { text: '    ' });

    expect(res.status).toBe(400);
  });

  test('reject a message post if sender is in the body (reject attempted impersonation)', async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();
    await seatPlayer(gameId, user.userId);

    const res = await user.client.post(`/games/${gameId}/messages`, {
      text: 'hi',
      fromPlayerId: randomUUID(),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /games/:gameId/messages', () => {
  test('lists public messages, oldest first, including sender usernames', async () => {
    const gameId = await createTestGame();
    const bob = await signedInUser();
    const noah = await signedInUser();
    await seatPlayer(gameId, bob.userId);
    await seatPlayer(gameId, noah.userId);

    await bob.client.post(`/games/${gameId}/messages`, { text: 'first msg' });
    await noah.client.post(`/games/${gameId}/messages`, { text: ' second msg ' });

    const res = await bob.client.get(`/games/${gameId}/messages`);
    const list = res.body.messages as Message[];

    expect(res.status).toBe(200);
    expect(list.map((message) => message.text)).toEqual(['first msg', 'second msg']);
    expect(list.map((message) => message.fromUsername)).toEqual([bob.username, noah.username]);
  });

  test("don't allow a user with no game seat to GET messages", async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();

    const res = await user.client.get(`/games/${gameId}/messages`);

    expect(res.status).toBe(403);
  });

  test('Leaves out private messages and messages from other games', async () => {
    const firstGameId = await createTestGame();
    const secondGameId = await createTestGame();
    const bob = await signedInUser();
    const noah = await signedInUser();
    const bobSeat = await seatPlayer(firstGameId, bob.userId);
    const noahSeat = await seatPlayer(firstGameId, noah.userId);
    await seatPlayer(secondGameId, bob.userId);

    await bob.client.post(`/games/${firstGameId}/messages`, { text: 'public msg' });
    await bob.client.post(`/games/${secondGameId}/messages`, { text: 'the other game' });

    // A fabricated private message since there's no private chat yet
    await db.insert(messages).values({
      gameId: firstGameId,
      fromPlayerId: bobSeat,
      toPlayerId: noahSeat,
      text: 'private msg',
    });

    const res = await noah.client.get(`/games/${firstGameId}/messages`);
    const list = res.body.messages as Message[];

    expect(res.status).toBe(200);
    expect(list.map((message) => message.text)).toEqual(['public msg']);
  });
});
