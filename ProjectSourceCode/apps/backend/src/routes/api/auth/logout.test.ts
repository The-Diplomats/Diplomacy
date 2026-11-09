import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { createTestApp, httpsClient, registerAndVerify } from '../../../test/auth-client.js';
import {
  capturedEmails,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../../../test/db.js';

describe('POST /auth/logout', () => {
  beforeAll(() => {
    setupTestServices();
  });

  beforeEach(() => {
    capturedEmails.length = 0;
  });

  afterAll(async () => {
    await teardownTestServices();
  });

  test('destroys the session', async () => {
    const creds = makeTestCredentials();
    const client = await registerAndVerify(createTestApp(), creds);

    const logout = await client.post('/auth/logout');
    expect(logout.status).toBe(204);

    expect((await client.get('/auth/me')).status).toBe(401);
  });

  test('without a session is a no-op 204', async () => {
    expect((await httpsClient(createTestApp()).post('/auth/logout')).status).toBe(204);
  });
});
