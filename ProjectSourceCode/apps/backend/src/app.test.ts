import session from 'express-session';
import supertest from 'supertest';
import { describe, expect, test } from 'vitest';

import { createApp } from './app.js';

const sessionMiddleware = session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
});

describe('backend app', () => {
  test('GET /api/health returns ok', async () => {
    const app = createApp({ sessionMiddleware });
    const response = await supertest(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/auth/me returns 401 when not authenticated', async () => {
    const app = createApp({ sessionMiddleware });
    const response = await supertest(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
