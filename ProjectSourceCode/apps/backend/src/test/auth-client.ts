import cors from 'cors';
import session from 'express-session';
import supertest from 'supertest';

import { createApp } from '../app.js';
import { openApiErrorHandler } from '../middleware/openapi-error-handler.js';
import { createOpenApiValidator } from '../middleware/openapi-validator.js';
import type { makeTestCredentials } from './db.js';
import { extractCodeFromLastEmail } from './db.js';

const openApiValidator = createOpenApiValidator({ validateResponses: true });

export type TestApp = ReturnType<typeof createApp>;

export function createTestApp(): TestApp {
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
  });
}

/**
 * Client that talks to the app as if through the TLS-terminating proxy
 * (`X-Forwarded-Proto: https`, honoured via `trust proxy`). supertest's own
 * agent won't resend a Secure cookie over its plain-HTTP socket, so the
 * session cookie is carried between requests here instead.
 */
export function httpsClient(instance: TestApp) {
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

/**
 * Registers + verifies a user in one shot. Returns the client with the
 * post-verify session cookie attached. Used by tests that just need a
 * signed-in user as a precondition.
 */
export async function registerAndVerify(
  instance: TestApp,
  creds: ReturnType<typeof makeTestCredentials>,
) {
  const client = httpsClient(instance);
  await client.post('/auth/register', creds);
  const code = extractCodeFromLastEmail();
  await client.post('/auth/register/verify', { identifier: creds.email, code });
  return client;
}
