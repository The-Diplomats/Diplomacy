import cors from 'cors';
import session from 'express-session';
import supertest from 'supertest';
import { describe, expect, test } from 'vitest';

import { createApp } from '../../../app.js';
import { openApiErrorHandler } from '../../../middleware/openapi-error-handler.js';
import { createOpenApiValidator } from '../../../middleware/openapi-validator.js';
import { createInMemoryUserRepository } from '../../../test/in-memory-users.js';

const openApiValidator = createOpenApiValidator({ validateResponses: true });

function app() {
  return createApp({
    corsMiddleware: cors({ origin: ['http://localhost'], credentials: true }),
    openApiValidator,
    openApiErrorHandler,
    // Non-secure cookie so supertest's agent sends it back over plain HTTP.
    sessionMiddleware: session({ secret: 'test-secret', resave: false, saveUninitialized: false }),
    users: createInMemoryUserRepository(),
  });
}

const credentials = { email: 'Player@Example.com', password: 'correct-horse' };

describe('auth routes', () => {
  test('register signs the user in; logout signs them out', async () => {
    const agent = supertest.agent(app());

    const registered = await agent.post('/auth/register').send(credentials);
    expect(registered.status).toBe(201);
    expect(registered.body).toEqual({ id: expect.any(String), email: 'player@example.com' });

    const me = await agent.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toEqual(registered.body);

    const logout = await agent.post('/auth/logout');
    expect(logout.status).toBe(204);

    expect((await agent.get('/auth/me')).status).toBe(401);
  });

  test('login with correct password establishes a session', async () => {
    const instance = app();
    await supertest(instance).post('/auth/register').send(credentials);

    const agent = supertest.agent(instance);
    const login = await agent
      .post('/auth/login')
      .send({ email: 'PLAYER@example.com', password: credentials.password });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe('player@example.com');

    expect((await agent.get('/auth/me')).body.email).toBe('player@example.com');
  });

  test('login rejects wrong password and unknown email with the same 401', async () => {
    const instance = app();
    await supertest(instance).post('/auth/register').send(credentials);

    const wrong = await supertest(instance)
      .post('/auth/login')
      .send({ email: credentials.email, password: 'nope-nope' });
    const unknown = await supertest(instance)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  test('register rejects a duplicate email with 409', async () => {
    const instance = app();
    await supertest(instance).post('/auth/register').send(credentials);

    const dup = await supertest(instance)
      .post('/auth/register')
      .send({ email: 'player@example.com', password: 'another-pass' });
    expect(dup.status).toBe(409);
  });

  test('register rejects a short password via the OpenAPI validator', async () => {
    const res = await supertest(app())
      .post('/auth/register')
      .send({ email: 'a@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('login rejects unknown fields via the OpenAPI validator', async () => {
    const res = await supertest(app())
      .post('/auth/login')
      .send({ ...credentials, remember: true });
    expect(res.status).toBe(400);
  });

  test('logout without a session is a no-op 204', async () => {
    expect((await supertest(app()).post('/auth/logout')).status).toBe(204);
  });
});
