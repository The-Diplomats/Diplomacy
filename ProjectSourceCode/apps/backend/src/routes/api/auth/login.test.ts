import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { createTestApp, httpsClient, registerAndVerify } from '../../../test/auth-client.js';
import {
  capturedEmails,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../../../test/db.js';

describe('POST /auth/login', () => {
  beforeAll(() => {
    setupTestServices();
  });

  beforeEach(() => {
    capturedEmails.length = 0;
  });

  afterAll(async () => {
    await teardownTestServices();
  });

  test('requires a verified account (403 otherwise)', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await httpsClient(instance).post('/auth/register', creds);

    const res = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
    });
    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('by email establishes a session for a verified user', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    const client = httpsClient(instance);
    const login = await client.post('/auth/login', {
      identifier: creds.email.toUpperCase(),
      password: creds.password,
    });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe(creds.email.toLowerCase());
  });

  test('by username establishes a session for a verified user', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    const client = httpsClient(instance);
    const login = await client.post('/auth/login', {
      identifier: creds.username.toLowerCase(),
      password: creds.password,
    });
    expect(login.status).toBe(200);
    expect(login.body.username).toBe(creds.username);
  });

  test('no session cookie is issued over plain HTTP', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    const login = await supertest(instance)
      .post('/auth/login')
      .send({ identifier: creds.email, password: creds.password });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toBeUndefined();
  });

  test('rejects wrong password and unknown identifier with the same 401', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    const wrong = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: 'nope-nope',
    });
    const unknown = await httpsClient(instance).post('/auth/login', {
      identifier: `nobody-${Date.now()}@test.local`,
      password: 'whatever1',
    });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  test('rejects unknown fields via the OpenAPI validator', async () => {
    const creds = makeTestCredentials();
    const res = await httpsClient(createTestApp()).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
      remember: true,
    });
    expect(res.status).toBe(400);
  });

  test('is rate limited after repeated failures for one account', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    const wrong = { identifier: creds.email, password: 'nope-nope' };

    for (let i = 0; i < 5; i++) {
      expect((await httpsClient(instance).post('/auth/login', wrong)).status).toBe(401);
    }

    const blocked = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
    });
    expect(blocked.status).toBe(429);

    const other = makeTestCredentials();
    const otherLogin = await httpsClient(instance).post('/auth/login', {
      identifier: other.email,
      password: 'whatever1',
    });
    expect(otherLogin.status).toBe(401);
  });

  test('successful logins do not count toward the failure limit', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    for (let i = 0; i < 6; i++) {
      expect(
        (
          await httpsClient(instance).post('/auth/login', {
            identifier: creds.email,
            password: creds.password,
          })
        ).status,
      ).toBe(200);
    }
  });
});
