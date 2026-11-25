import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ClientToServerEvents, Message, ServerToClientEvents } from '@diplomacy/contracts';
import { type DbClient, games } from '@diplomacy/db';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import session from 'express-session';
import { io as connectClient, type Socket } from 'socket.io-client';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { createApp } from '../app.js';
import { resetAuthRateLimits } from '../middleware/auth-rate-limits.js';
import { openApiErrorHandler } from '../middleware/openapi-error-handler.js';
import { createOpenApiValidator } from '../middleware/openapi-validator.js';
import { createPlayerRepository } from '../repositories/players.js';
import { initRealtime } from '../services/realtime.js';
import { createSocketServer } from '../socket.js';
import { registerAndVerify, type TestApp } from '../test/auth-client.js';
import {
  capturedEmails,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../test/db.js';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let db: DbClient;
let app: TestApp;
let baseUrl: string;
let closeSocketServer: () => Promise<void>;
const openSockets: ClientSocket[] = [];
const testGameIds: string[] = [];
let store: session.MemoryStore;

beforeAll(async () => {
  db = setupTestServices();

  store = new session.MemoryStore();
  const sessionMiddleware = session({
    store,
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: 'lax' },
  });
  app = createApp({
    corsMiddleware: cors({ origin: ['http://localhost'], credentials: true }),
    openApiValidator: createOpenApiValidator({ validateResponses: true }),
    openApiErrorHandler,
    sessionMiddleware,
  });

  const httpServer = createServer(app);
  const socketServer = createSocketServer(httpServer, {
    sessionMiddleware,
    origins: ['http://localhost'],
  });
  initRealtime(socketServer.io);
  closeSocketServer = socketServer.close;

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  baseUrl = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

beforeEach(() => {
  capturedEmails.length = 0;
  resetAuthRateLimits();
});

afterAll(async () => {
  for (const socket of openSockets) {
    socket.disconnect();
  }
  await closeSocketServer();
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
    throw new Error('Failed to create test game');
  }
  testGameIds.push(game.id);
  return game.id;
}

async function signedInUser() {
  const creds = makeTestCredentials();
  await registerAndVerify(app, creds);

  const login = await supertest(app)
    .post('/auth/login')
    .set('X-Forwarded-Proto', 'https')
    .send({ identifier: creds.email, password: creds.password });
  const setCookie = login.headers['set-cookie'] as unknown as string[];
  const cookie = setCookie.find((value) => value.startsWith('connect.sid='))?.split(';')[0];
  if (!cookie) {
    throw new Error('Login did not return a session cookie');
  }

  const me = await supertest(app)
    .get('/auth/me')
    .set('X-Forwarded-Proto', 'https')
    .set('Cookie', cookie);
  return { cookie, userId: me.body.id as string };
}

function sessionIdFromCookie(cookie: string): string {
  const value = decodeURIComponent(cookie.split('=')[1] ?? '');
  return value.slice(2, value.lastIndexOf('.'));
}

async function seatPlayer(gameId: string, userId: string): Promise<string> {
  const row = await createPlayerRepository(db).addSeat({ gameId, userId });
  if (!row) {
    throw new Error('Failed to seat the test user');
  }
  return row.id;
}

function connect(cookie?: string): Promise<ClientSocket> {
  const socket: ClientSocket = connectClient(baseUrl, {
    transports: ['websocket'],
    forceNew: true,
    extraHeaders: cookie ? { Cookie: cookie } : {},
  });
  openSockets.push(socket);
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function join(socket: ClientSocket, gameId: unknown): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    socket.emit('game:join', { gameId } as { gameId: string }, resolve);
  });
}

function nextMessage(socket: ClientSocket): Promise<Message> {
  return new Promise((resolve) => socket.once('message:new', resolve));
}

function nextDm(socket: ClientSocket): Promise<Message> {
  return new Promise((resolve) => socket.once('message:dm', resolve));
}

async function postMessage(cookie: string, gameId: string, text: string): Promise<void> {
  const res = await supertest(app)
    .post(`/games/${gameId}/messages`)
    .set('X-Forwarded-Proto', 'https')
    .set('Cookie', cookie)
    .send({ text });
  expect(res.status).toBe(201);
}

async function postDm(cookie: string, gameId: string, toPlayerId: string, text: string) {
  const res = await supertest(app)
    .post(`/games/${gameId}/messages/dm/${toPlayerId}`)
    .set('X-Forwarded-Proto', 'https')
    .set('Cookie', cookie)
    .send({ text });
  expect(res.status).toBe(201);
}

describe('game:join', () => {
  test('seated player can join the game room', async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();
    await seatPlayer(gameId, user.userId);

    const socket = await connect(user.cookie);

    expect(await join(socket, gameId)).toEqual({ ok: true });
  });

  test('rejects a player without a seat in the game', async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();

    const socket = await connect(user.cookie);

    expect(await join(socket, gameId)).toEqual({ ok: false });
  });

  test('rejects a socket without a session', async () => {
    const gameId = await createTestGame();

    const socket = await connect();

    expect(await join(socket, gameId)).toEqual({ ok: false });
  });

  test("rejects a malformed game id and server doesn't crash", async () => {
    const user = await signedInUser();
    const socket = await connect(user.cookie);

    expect(await join(socket, 'fake-uuid')).toEqual({ ok: false });
    expect(await join(socket, 99999)).toEqual({ ok: false });

    /* Is the server still okay after that invalid input? */
    const gameId = await createTestGame();
    await seatPlayer(gameId, user.userId);
    expect(await join(socket, gameId)).toEqual({ ok: true });
  });
});

describe('message:new', () => {
  test('delives a message to the other players in the room', async () => {
    const gameId = await createTestGame();
    const sender = await signedInUser();
    const receiver = await signedInUser();
    await seatPlayer(gameId, sender.userId);
    await seatPlayer(gameId, receiver.userId);

    const socket = await connect(receiver.cookie);
    await join(socket, gameId);
    const received_msg = nextMessage(socket);

    await postMessage(sender.cookie, gameId, 'This is a public room message');

    expect(await received_msg).toMatchObject({ gameId, text: 'This is a public room message' });
  });

  test("messages aren't delivered from one game to another", async () => {
    const gameA = await createTestGame();
    const gameB = await createTestGame();
    const user = await signedInUser();
    await seatPlayer(gameA, user.userId);
    await seatPlayer(gameB, user.userId);

    const socket = await connect(user.cookie);
    await join(socket, gameB);
    const received_msg = nextMessage(socket);

    await postMessage(user.cookie, gameA, 'to game A');
    await postMessage(user.cookie, gameB, 'to game B');

    expect(await received_msg).toMatchObject({ gameId: gameB, text: 'to game B' });
  });
});

describe('logout', () => {
  test('disconnects sockets opened with a session when session ends (logout)', async () => {
    const user = await signedInUser();
    const socket = await connect(user.cookie);
    const disconnected = new Promise<string>((resolve) => socket.once('disconnect', resolve));

    const res = await supertest(app)
      .post('/auth/logout')
      .set('X-Forwarded-Proto', 'https')
      .set('Cookie', user.cookie);
    expect(res.status).toBe(204);

    expect(await disconnected).toBe('io server disconnect');
  });

  test('socket whose session no longer exists cannot connect to a game', async () => {
    const gameId = await createTestGame();
    const user = await signedInUser();
    await seatPlayer(gameId, user.userId);
    const socket = await connect(user.cookie);

    await new Promise<void>((resolve) => {
      store.destroy(sessionIdFromCookie(user.cookie), () => resolve());
    });

    expect(await join(socket, gameId)).toEqual({ ok: false });
  });
});

describe('message:dm', () => {
  test('message sent to sender and recipient but not others', async () => {
    const gameId = await createTestGame();
    const bob = await signedInUser();
    const noah = await signedInUser();
    const srisha = await signedInUser();
    await seatPlayer(gameId, bob.userId);
    const noahPlayerId = await seatPlayer(gameId, noah.userId);
    const srishaPlayerId = await seatPlayer(gameId, srisha.userId);

    const bobSocket = await connect(bob.cookie);
    const noahSocket = await connect(noah.cookie);
    const srishaSocket = await connect(srisha.cookie);
    await join(bobSocket, gameId);
    await join(noahSocket, gameId);
    await join(srishaSocket, gameId);

    const bobGets = nextDm(bobSocket);
    const noahGets = nextDm(noahSocket);
    const srishaGets = nextDm(srishaSocket);

    await postDm(bob.cookie, gameId, noahPlayerId, 'to Noah only');
    await postDm(bob.cookie, gameId, srishaPlayerId, 'to Srisha only');

    expect(await noahGets).toMatchObject({ text: 'to Noah only', toPlayerId: noahPlayerId });
    expect(await bobGets).toMatchObject({ text: 'to Noah only' });

    expect(await srishaGets).toMatchObject({ text: 'to Srisha only', toPlayerId: srishaPlayerId });
  });
});
