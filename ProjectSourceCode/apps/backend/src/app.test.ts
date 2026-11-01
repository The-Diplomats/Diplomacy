import cors from 'cors';
import session from 'express-session';
import supertest from 'supertest';
import { describe, expect, test } from 'vitest';

import { createApp } from './app.js';
import { openApiErrorHandler } from './middleware/openapi-error-handler.js';
import { createOpenApiValidator } from './middleware/openapi-validator.js';

const corsMiddleware = cors({ origin: ['http://localhost'], credentials: true });

const openApiValidator = createOpenApiValidator({ validateResponses: false });

const sessionMiddleware = session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true },
});

function app() {
  return createApp({
    corsMiddleware,
    openApiValidator,
    openApiErrorHandler,
    sessionMiddleware,
  });
}

describe('backend app', () => {
  test('GET /health returns ok', async () => {
    const response = await supertest(app()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /auth/me returns 401 when not authenticated', async () => {
    const response = await supertest(app()).get('/auth/me');
    expect(response.status).toBe(401);
  });

  test('GET /queues on admin host returns 403 without admin session', async () => {
    const response = await supertest(app()).get('/queues').set('Host', 'admin.dev.diplomacy.gg');
    expect(response.status).toBe(403);
  });

  test('GET /queues on api host returns 404', async () => {
    const response = await supertest(app()).get('/queues').set('Host', 'api.dev.diplomacy.gg');
    expect(response.status).toBe(404);
  });

  test('GET /health on admin host returns 404', async () => {
    const response = await supertest(app()).get('/health').set('Host', 'admin.dev.diplomacy.gg');
    expect(response.status).toBe(404);
  });

  test('GET /unknown host returns 404', async () => {
    const response = await supertest(app()).get('/health').set('Host', 'evil.com');
    expect(response.status).toBe(404);
  });

  test('POST /health returns 405 (method not in spec)', async () => {
    const response = await supertest(app()).post('/health');
    expect(response.status).toBe(405);
    expect(response.body.title).toBe('Method Not Allowed');
  });

  test('POST /health includes Allow header on 405', async () => {
    const response = await supertest(app()).post('/health');
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET');
  });

  test('GET /unknown-path passes through to Express 404', async () => {
    const response = await supertest(app()).get('/unknown-path');
    expect(response.status).toBe(404);
  });
});
