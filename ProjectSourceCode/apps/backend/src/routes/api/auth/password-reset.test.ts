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

describe('POST /auth/password-reset', () => {
  test('sends an email with a 6-digit code to a verified user', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    capturedEmails.length = 0;

    const res = await httpsClient(instance).post('/auth/password-reset', {
      email: creds.email,
    });
    expect(res.status).toBe(202);

    const email = capturedEmails.at(-1);
    expect(email).toBeDefined();
    expect(email!.subject.toLowerCase()).toContain('reset');
    expect(email!.text).toMatch(/\b\d{6}\b/);
  });

  test('is 202 for an unknown email (enumeration-safe)', async () => {
    const creds = makeTestCredentials();
    const res = await httpsClient(createTestApp()).post('/auth/password-reset', {
      email: creds.email,
    });
    expect(res.status).toBe(202);
    expect(capturedEmails.length).toBe(0);
  });
});

describe('POST /auth/password-reset/verify', () => {
  test('with correct code updates password and signs in', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    capturedEmails.length = 0;

    await httpsClient(instance).post('/auth/password-reset', { email: creds.email });
    const code = extractCodeFromLastEmail();

    const client = httpsClient(instance);
    const newPassword = 'brand-new-pass';
    const verified = await client.post('/auth/password-reset/verify', {
      email: creds.email,
      code,
      newPassword,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.email).toBe(creds.email.toLowerCase());

    const oldLogin = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
  });

  test('with wrong code returns 400', async () => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    await httpsClient(instance).post('/auth/password-reset', { email: creds.email });

    const res = await httpsClient(instance).post('/auth/password-reset/verify', {
      email: creds.email,
      code: '000000',
      newPassword: 'brand-new-pass',
    });
    expect(res.status).toBe(400);
  });
});
