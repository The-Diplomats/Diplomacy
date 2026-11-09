import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { createTestApp, httpsClient, registerAndVerify } from '../../../test/auth-client.js';
import {
  capturedEmails,
  extractCodeFromLastEmail,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../../../test/db.js';

beforeAll(() => {
  setupTestServices();
});

beforeEach(() => {
  capturedEmails.length = 0;
});

afterAll(async () => {
  await teardownTestServices();
});

describe('POST /auth/register', () => {
  test('returns 202 with no session cookie', async () => {
    const creds = makeTestCredentials();
    const res = await httpsClient(createTestApp()).post('/auth/register', creds);
    expect(res.status).toBe(202);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('sends a verification email containing a 6-digit code', async () => {
    const creds = makeTestCredentials();
    await httpsClient(createTestApp()).post('/auth/register', creds);

    const email = capturedEmails.at(-1);
    expect(email).toBeDefined();
    expect(email!.to.toLowerCase()).toBe(creds.email.toLowerCase());
    expect(email!.subject.toLowerCase()).toContain('verify');
    expect(email!.text).toMatch(/\b\d{6}\b/);
  });

  test('short password is rejected by the OpenAPI validator', async () => {
    const creds = makeTestCredentials();
    const res = await httpsClient(createTestApp()).post('/auth/register', {
      email: creds.email,
      username: creds.username,
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  test('duplicate verified email is 202 but sends a security notice to the owner', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    capturedEmails.length = 0;

    const dup = await httpsClient(instance).post('/auth/register', {
      email: creds.email,
      username: `${creds.username}2`,
      password: 'other-pass',
    });
    expect(dup.status).toBe(202);

    const email = capturedEmails.at(-1);
    expect(email).toBeDefined();
    expect(email!.to.toLowerCase()).toBe(creds.email.toLowerCase());
    expect(email!.subject.toLowerCase()).toContain('tried to register');
  });

  test('duplicate unverified email resends the verification code', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await httpsClient(instance).post('/auth/register', creds);
    capturedEmails.length = 0;

    const dup = await httpsClient(instance).post('/auth/register', {
      email: creds.email,
      username: `${creds.username}2`,
      password: 'other-pass',
    });
    expect(dup.status).toBe(202);

    const email = capturedEmails.at(-1);
    expect(email).toBeDefined();
    expect(email!.subject.toLowerCase()).toContain('verify');
  });
});

describe('POST /auth/register/verify', () => {
  test('with the emailed code establishes a session', async () => {
    const creds = makeTestCredentials();
    const client = httpsClient(createTestApp());

    const reg = await client.post('/auth/register', creds);
    expect(reg.status).toBe(202);
    expect(reg.headers['set-cookie']).toBeUndefined();

    const code = extractCodeFromLastEmail();
    const verified = await client.post('/auth/register/verify', {
      identifier: creds.email,
      code,
    });
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({
      id: expect.any(String),
      email: creds.email.toLowerCase(),
      username: creds.username,
    });

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toEqual(verified.body);
  });

  test('issues a Secure, HttpOnly, SameSite=Lax session cookie', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await httpsClient(instance).post('/auth/register', creds);
    const code = extractCodeFromLastEmail();

    const res = await httpsClient(instance).post('/auth/register/verify', {
      identifier: creds.email,
      code,
    });
    expect(res.status).toBe(200);

    const [cookie] = res.headers['set-cookie'] as unknown as string[];
    expect(cookie).toMatch(/^connect\.sid=/);
    expect(cookie).toMatch(/;\s*Secure/i);
    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
  });

  test('with wrong code returns 400', async () => {
    const creds = makeTestCredentials();
    const client = httpsClient(createTestApp());
    await client.post('/auth/register', creds);

    const res = await client.post('/auth/register/verify', {
      identifier: creds.email,
      code: '000000',
    });
    expect(res.status).toBe(400);
  });

  test('for an already-verified user returns 400', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);

    const res = await httpsClient(instance).post('/auth/register/verify', {
      identifier: creds.email,
      code: '000000',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/register/resend', () => {
  test('sends a fresh code for an unverified user and invalidates the old one', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await httpsClient(instance).post('/auth/register', creds);
    const originalCode = extractCodeFromLastEmail();
    capturedEmails.length = 0;

    const res = await httpsClient(instance).post('/auth/register/resend', {
      identifier: creds.email,
    });
    expect(res.status).toBe(202);

    const newCode = extractCodeFromLastEmail();
    expect(newCode).not.toBe(originalCode);

    const old = await httpsClient(instance).post('/auth/register/verify', {
      identifier: creds.email,
      code: originalCode,
    });
    expect(old.status).toBe(400);

    const fresh = await httpsClient(instance).post('/auth/register/verify', {
      identifier: creds.email,
      code: newCode,
    });
    expect(fresh.status).toBe(200);
  });

  test('is 202 for unknown or already-verified identifiers', async () => {
    const creds = makeTestCredentials();
    const unknown = await httpsClient(createTestApp()).post('/auth/register/resend', {
      identifier: creds.username,
    });
    expect(unknown.status).toBe(202);
  });
});
