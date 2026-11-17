import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { initAccess, OPEN_ACCESS } from '../services/access.js';
import { createTestApp } from '../test/auth-client.js';
import { setupTestServices, teardownTestServices } from '../test/db.js';

describe('maintenance mode', () => {
  beforeAll(() => {
    setupTestServices();
  });

  beforeEach(() => {
    initAccess({ ...OPEN_ACCESS, maintenanceMode: true });
  });

  afterEach(() => {
    initAccess(OPEN_ACCESS);
  });

  afterAll(async () => {
    await teardownTestServices();
  });

  test('API routes return 503 with Retry-After and a problem body', async () => {
    const res = await supertest(createTestApp())
      .get('/auth/me')
      .set('Host', 'api.dev.diplomacy.gg');
    expect(res.status).toBe(503);
    expect(res.headers['retry-after']).toBe('300');
    expect(res.body).toMatchObject({ status: 503, title: 'Service Unavailable' });
  });

  test('the 503 carries CORS headers so the frontend can read it', async () => {
    const res = await supertest(createTestApp())
      .get('/auth/me')
      .set('Host', 'api.dev.diplomacy.gg')
      .set('Origin', 'http://localhost');
    expect(res.status).toBe(503);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost');
  });

  test('/health stays up for platform probes', async () => {
    const res = await supertest(createTestApp()).get('/health').set('Host', 'api.dev.diplomacy.gg');
    expect(res.status).toBe(200);
  });

  test('the admin surface stays reachable', async () => {
    const res = await supertest(createTestApp())
      .get('/queues')
      .set('Host', 'admin.dev.diplomacy.gg');
    expect(res.status).toBe(403);
  });

  test('requests go through normally once maintenance ends', async () => {
    initAccess(OPEN_ACCESS);
    const res = await supertest(createTestApp())
      .get('/auth/me')
      .set('Host', 'api.dev.diplomacy.gg');
    expect(res.status).toBe(401);
  });
});
