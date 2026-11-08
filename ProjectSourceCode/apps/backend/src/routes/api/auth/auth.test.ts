import cors from 'cors';
import session from 'express-session';
import supertest from 'supertest';
import { describe, expect, test } from 'vitest';

import { createApp } from '../../../app.js';
import { openApiErrorHandler } from '../../../middleware/openapi-error-handler.js';
import { createOpenApiValidator } from '../../../middleware/openapi-validator.js';
import { createInMemoryUserRepository } from '../../../test/in-memory-users.js';

const openApiValidator = createOpenApiValidator({ validateResponses: true });

type App = ReturnType<typeof createApp>;

function app(): App {
  return createApp({
    corsMiddleware: cors({ origin: ['http://localhost'], credentials: true }),
    openApiValidator,
    openApiErrorHandler,
    // Same cookie policy as production: the session cookie is only ever
    // issued and sent over HTTPS.
    sessionMiddleware: session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true, httpOnly: true, sameSite: 'lax' },
    }),
    users: createInMemoryUserRepository(),
  });
}

/**
 * Client that talks to the app as if through the TLS-terminating proxy
 * (`X-Forwarded-Proto: https`, honoured via `trust proxy`). supertest's own
 * agent won't resend a Secure cookie over its plain-HTTP socket, so the
 * session cookie is carried between requests here instead.
 */
function https(instance: App) {
  let cookie: string | undefined;

  const request = async (method: 'get' | 'post', path: string, body?: object) => {
    let req = supertest(instance)[method](path).set('X-Forwarded-Proto', 'https');
    if (cookie) {
      req = req.set('Cookie', cookie);
    }
    const res = body === undefined ? await req : await req.send(body);

    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    const sid = setCookie?.find((c) => c.startsWith('connect.sid='));
    if (sid) {
      cookie = sid.split(';')[0];
    }
    return res;
  };

  return {
    get: (path: string) => request('get', path),
    post: (path: string, body?: object) => request('post', path, body),
  };
}

const credentials = { email: 'Player@Example.com', password: 'correct-horse' };

describe('auth routes', () => {
  test('register signs the user in; logout signs them out', async () => {
    const client = https(app());

    const registered = await client.post('/auth/register', credentials);
    expect(registered.status).toBe(201);
    expect(registered.body).toEqual({ id: expect.any(String), email: 'player@example.com' });

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toEqual(registered.body);

    const logout = await client.post('/auth/logout');
    expect(logout.status).toBe(204);

    expect((await client.get('/auth/me')).status).toBe(401);
  });

  test('login with correct password establishes a session', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);

    const client = https(instance);
    const login = await client.post('/auth/login', {
      email: 'PLAYER@example.com',
      password: credentials.password,
    });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe('player@example.com');

    expect((await client.get('/auth/me')).body.email).toBe('player@example.com');
  });

  test('session cookie is Secure, HttpOnly and SameSite=Lax', async () => {
    const res = await https(app()).post('/auth/register', credentials);
    expect(res.status).toBe(201);

    const [cookie] = res.headers['set-cookie'] as unknown as string[];
    expect(cookie).toMatch(/^connect\.sid=/);
    expect(cookie).toMatch(/;\s*Secure/i);
    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
  });

  test('no session cookie is issued over plain HTTP', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);

    const login = await supertest(instance).post('/auth/login').send(credentials);
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toBeUndefined();
  });

  test('login rejects wrong password and unknown email with the same 401', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);

    const wrong = await https(instance).post('/auth/login', {
      email: credentials.email,
      password: 'nope-nope',
    });
    const unknown = await https(instance).post('/auth/login', {
      email: 'nobody@example.com',
      password: 'whatever1',
    });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  test('register rejects a duplicate email with 409', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);

    const dup = await https(instance).post('/auth/register', {
      email: 'player@example.com',
      password: 'another-pass',
    });
    expect(dup.status).toBe(409);
  });

  test('register rejects a short password via the OpenAPI validator', async () => {
    const res = await https(app()).post('/auth/register', {
      email: 'a@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  test('login rejects unknown fields via the OpenAPI validator', async () => {
    const res = await https(app()).post('/auth/login', { ...credentials, remember: true });
    expect(res.status).toBe(400);
  });

  test('login is rate limited after repeated failures for one account', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);
    const wrong = { email: credentials.email, password: 'nope-nope' };

    for (let i = 0; i < 5; i++) {
      expect((await https(instance).post('/auth/login', wrong)).status).toBe(401);
    }

    // Further attempts are blocked, even with the correct password.
    const blocked = await https(instance).post('/auth/login', credentials);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      title: 'Too Many Requests',
      status: 429,
      detail: 'Too many login attempts. Please try again later.',
    });
    expect(blocked.headers['ratelimit-policy']).toBeDefined();

    // A different account from the same IP is unaffected.
    const other = await https(instance).post('/auth/login', {
      email: 'someone-else@example.com',
      password: 'whatever1',
    });
    expect(other.status).toBe(401);
  });

  test('successful logins do not count toward the failure limit', async () => {
    const instance = app();
    await https(instance).post('/auth/register', credentials);

    for (let i = 0; i < 6; i++) {
      expect((await https(instance).post('/auth/login', credentials)).status).toBe(200);
    }
  });

  test('logout without a session is a no-op 204', async () => {
    expect((await https(app()).post('/auth/logout')).status).toBe(204);
  });
});
