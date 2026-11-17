import { randomUUID } from 'node:crypto';

import type { OAuthProvider } from '@diplomacy/contracts';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import type { OAuthIdentity, OAuthProviderClient } from '../../../auth/oauth-providers.js';
import { resetAuthRateLimits } from '../../../middleware/auth-rate-limits.js';
import { initAccess, OPEN_ACCESS } from '../../../services/access.js';
import { setOAuth } from '../../../services/oauth.js';
import { createTestApp, httpsClient, registerAndVerify } from '../../../test/auth-client.js';
import {
  capturedEmails,
  makeTestCredentials,
  setupTestServices,
  teardownTestServices,
} from '../../../test/db.js';

const APP_URL = 'https://app.test';

/** Identity the fake provider hands back on the next code exchange. */
let nextIdentity: OAuthIdentity;

function fakeProvider(): OAuthProviderClient {
  return {
    async authorizationUrl({ redirectUri, state, nonce, codeChallenge }) {
      const url = new URL('https://idp.test/authorize');
      url.search = new URLSearchParams({
        redirect_uri: redirectUri,
        state,
        nonce,
        code_challenge: codeChallenge,
      }).toString();
      return url;
    },
    async exchangeCode(callbackUrl, checks) {
      if (callbackUrl.searchParams.get('state') !== checks.state) {
        throw new Error('state mismatch');
      }
      return nextIdentity;
    },
  };
}

function makeIdentity(overrides: Partial<OAuthIdentity> = {}): OAuthIdentity {
  const id = randomUUID().slice(0, 8);
  return {
    provider: 'google',
    subject: `sub-${randomUUID()}`,
    email: `oauth-${id}@test.local`,
    emailVerified: true,
    displayName: `Oauth ${id}`,
    ...overrides,
  };
}

type Client = ReturnType<typeof httpsClient>;

async function signInWithProvider(
  client: Client,
  options: { provider?: OAuthProvider; next?: string; state?: string } = {},
) {
  const provider = options.provider ?? 'google';
  const login = await client.post(`/auth/oauth/${provider}/login`, { next: options.next });
  expect(login.status).toBe(200);
  const state = options.state ?? new URL(login.body.url).searchParams.get('state');
  // Real providers send the code with unencoded reserved characters, plus extra
  // params like Google's `scope`; the spec must accept both.
  const callback = await client.get(
    `/auth/oauth/${provider}/callback?code=4/0AeanS0R!x$y&state=${state}` +
      '&scope=email+openid+https://www.googleapis.com/auth/userinfo.email&authuser=0',
  );
  expect(callback.status).toBe(302);
  return new URL(callback.headers.location as string);
}

describe('OAuth sign-in', () => {
  beforeAll(() => {
    setupTestServices();
    setOAuth({
      providers: { google: fakeProvider() },
      apiPublicUrl: 'https://api.test',
      appUrl: APP_URL,
    });
  });

  beforeEach(() => {
    capturedEmails.length = 0;
    resetAuthRateLimits();
  });

  afterAll(async () => {
    await teardownTestServices();
  });

  test('lists only configured providers', async () => {
    const res = await httpsClient(createTestApp()).get('/auth/oauth/providers');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ providers: ['google'] });
  });

  test('404s for a provider that is not configured', async () => {
    const res = await httpsClient(createTestApp()).post('/auth/oauth/microsoft/login', {});
    expect(res.status).toBe(404);
  });

  test('login accepts a request with no body', async () => {
    const res = await httpsClient(createTestApp()).post('/auth/oauth/google/login');
    expect(res.status).toBe(200);
    expect(res.body.url).toBeTruthy();
  });

  test('authorization URL carries PKCE, state, nonce and the callback redirect URI', async () => {
    const res = await httpsClient(createTestApp()).post('/auth/oauth/google/login', {});
    const url = new URL(res.body.url);
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://api.test/auth/oauth/google/callback',
    );
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('nonce')).toBeTruthy();
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  test('new identity picks a username, then signs straight in next time', async () => {
    const instance = createTestApp();
    const identity = makeIdentity();
    nextIdentity = identity;

    const client = httpsClient(instance);
    const redirect = await signInWithProvider(client, { next: '/game/abc' });
    expect(redirect.origin + redirect.pathname).toBe(`${APP_URL}/auth/oauth/complete`);
    expect(redirect.searchParams.get('next')).toBe('/game/abc');
    expect((await client.get('/auth/me')).status).toBe(401);

    const pending = await client.get('/auth/oauth/pending');
    expect(pending.status).toBe(200);
    expect(pending.body).toMatchObject({ provider: 'google', email: identity.email });

    const username = `G_${randomUUID().slice(0, 8)}`;
    const complete = await client.post('/auth/oauth/complete', { username });
    expect(complete.status).toBe(200);
    expect(complete.body).toMatchObject({ email: identity.email, username });
    expect((await client.get('/auth/oauth/pending')).status).toBe(404);

    const returning = httpsClient(instance);
    const again = await signInWithProvider(returning);
    expect(again.href).toBe(`${APP_URL}/lobby`);
    const me = await returning.get('/auth/me');
    expect(me.body.username).toBe(username);
  });

  test('complete rejects a taken username with 409', async () => {
    const instance = createTestApp();
    const existing = makeTestCredentials();
    await registerAndVerify(instance, existing);

    nextIdentity = makeIdentity();
    const client = httpsClient(instance);
    await signInWithProvider(client);
    const complete = await client.post('/auth/oauth/complete', {
      username: existing.username.toLowerCase(),
    });
    expect(complete.status).toBe(409);
  });

  test('complete without a pending sign-up is 404', async () => {
    const res = await httpsClient(createTestApp()).post('/auth/oauth/complete', {
      username: 'nobody_here',
    });
    expect(res.status).toBe(404);
  });

  test('links to a verified password account with the same verified email', async () => {
    const instance = createTestApp();
    const creds = makeTestCredentials();
    await registerAndVerify(instance, creds);
    nextIdentity = makeIdentity({ email: creds.email.toLowerCase() });

    capturedEmails.length = 0;
    const client = httpsClient(instance);
    const redirect = await signInWithProvider(client);
    expect(redirect.href).toBe(`${APP_URL}/lobby`);
    expect((await client.get('/auth/me')).body.username).toBe(creds.username);

    expect(capturedEmails).toHaveLength(1);
    expect(capturedEmails[0]?.to).toBe(creds.email.toLowerCase());
    expect(capturedEmails[0]?.subject).toBe('Google sign-in was added to your account');

    const passwordLogin = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
    });
    expect(passwordLogin.status).toBe(200);
  });

  test('linking to an unverified account verifies it and drops the unproven password', async () => {
    const instance = createTestApp();
    const creds = makeTestCredentials();
    await httpsClient(instance).post('/auth/register', creds);
    nextIdentity = makeIdentity({ email: creds.email.toLowerCase() });

    capturedEmails.length = 0;
    const client = httpsClient(instance);
    await signInWithProvider(client);
    expect((await client.get('/auth/me')).body.username).toBe(creds.username);
    // No proven owner to warn: the person signing in is the email's owner.
    expect(capturedEmails).toHaveLength(0);

    const passwordLogin = await httpsClient(instance).post('/auth/login', {
      identifier: creds.email,
      password: creds.password,
    });
    expect(passwordLogin.status).toBe(401);
  });

  test('refuses an email the provider has not verified', async () => {
    const instance = createTestApp();
    const creds = makeTestCredentials();
    await registerAndVerify(instance, creds);
    nextIdentity = makeIdentity({ email: creds.email.toLowerCase(), emailVerified: false });

    const client = httpsClient(instance);
    const redirect = await signInWithProvider(client);
    expect(redirect.pathname).toBe('/auth/login');
    expect(redirect.searchParams.get('oauthError')).toBe('email_unverified');
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  test('refuses to link an account that already has a different identity', async () => {
    const instance = createTestApp();
    const email = makeIdentity().email;
    nextIdentity = makeIdentity({ email });
    const first = httpsClient(instance);
    await signInWithProvider(first);
    await first.post('/auth/oauth/complete', { username: `L_${randomUUID().slice(0, 8)}` });

    nextIdentity = makeIdentity({ email });
    const second = httpsClient(instance);
    const redirect = await signInWithProvider(second);
    expect(redirect.searchParams.get('oauthError')).toBe('linked_elsewhere');
    expect((await second.get('/auth/me')).status).toBe(401);
  });

  test('a mismatched state fails without signing in', async () => {
    nextIdentity = makeIdentity();
    const client = httpsClient(createTestApp());
    const redirect = await signInWithProvider(client, { state: 'forged' });
    expect(redirect.searchParams.get('oauthError')).toBe('failed');
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  test('a callback with no flow in progress fails', async () => {
    const res = await httpsClient(createTestApp()).get(
      '/auth/oauth/google/callback?code=x&state=y',
    );
    expect(res.status).toBe(302);
    expect(new URL(res.headers.location as string).searchParams.get('oauthError')).toBe('failed');
  });

  test('a callback without state redirects instead of failing validation', async () => {
    const res = await httpsClient(createTestApp()).get('/auth/oauth/google/callback?code=x');
    expect(res.status).toBe(302);
    expect(new URL(res.headers.location as string).searchParams.get('oauthError')).toBe('failed');
  });

  test('a callback without state fails even with a flow in progress', async () => {
    nextIdentity = makeIdentity();
    const client = httpsClient(createTestApp());
    expect((await client.post('/auth/oauth/google/login', {})).status).toBe(200);

    const res = await client.get('/auth/oauth/google/callback?code=x');
    expect(res.status).toBe(302);
    expect(new URL(res.headers.location as string).searchParams.get('oauthError')).toBe('failed');
    expect((await client.get('/auth/me')).status).toBe(401);
    expect((await client.get('/auth/oauth/pending')).status).toBe(404);
  });

  test('a rate-limited callback redirects to the login page', async () => {
    const client = httpsClient(createTestApp());
    let res = await client.get('/auth/oauth/google/callback?code=x&state=y');
    for (let attempt = 1; attempt <= 60; attempt++) {
      res = await client.get('/auth/oauth/google/callback?code=x&state=y');
    }
    expect(res.status).toBe(302);
    expect(new URL(res.headers.location as string).searchParams.get('oauthError')).toBe(
      'rate_limited',
    );
  });

  describe('in invite mode', () => {
    function inviteOnly(...emails: string[]) {
      initAccess({
        signupMode: 'invite',
        signupAllowlist: new Set(emails.map((email) => email.toLowerCase())),
        maintenanceMode: false,
      });
    }

    afterEach(() => {
      initAccess(OPEN_ACCESS);
    });

    test('a new identity off the allowlist is turned away with invite_only', async () => {
      nextIdentity = makeIdentity();
      inviteOnly('someone-else@test.local');
      const client = httpsClient(createTestApp());

      const redirect = await signInWithProvider(client);
      expect(redirect.searchParams.get('oauthError')).toBe('invite_only');
      expect((await client.get('/auth/oauth/pending')).status).toBe(404);
      expect((await client.get('/auth/me')).status).toBe(401);
    });

    test('a new identity on the allowlist goes on to pick a username', async () => {
      const identity = makeIdentity();
      nextIdentity = identity;
      inviteOnly(identity.email);
      const client = httpsClient(createTestApp());

      const redirect = await signInWithProvider(client);
      expect(redirect.pathname).toBe('/auth/oauth/complete');
      expect((await client.get('/auth/oauth/pending')).status).toBe(200);
    });

    test('an existing account off the allowlist still signs in', async () => {
      const instance = createTestApp();
      const creds = makeTestCredentials();
      await registerAndVerify(instance, creds);
      nextIdentity = makeIdentity({ email: creds.email.toLowerCase() });
      inviteOnly('someone-else@test.local');

      const client = httpsClient(instance);
      const redirect = await signInWithProvider(client);
      expect(redirect.href).toBe(`${APP_URL}/lobby`);
      expect((await client.get('/auth/me')).body.username).toBe(creds.username);
    });
  });

  test('user cancelling at the provider maps to cancelled', async () => {
    const client = httpsClient(createTestApp());
    const login = await client.post('/auth/oauth/google/login', {});
    const state = new URL(login.body.url).searchParams.get('state');
    const res = await client.get(
      `/auth/oauth/google/callback?error=access_denied&error_description=nope&state=${state}`,
    );
    expect(new URL(res.headers.location as string).searchParams.get('oauthError')).toBe(
      'cancelled',
    );
  });

  test.each([
    '//evil.test/x',
    '/\\evil.test',
    'https://evil.test',
    '/\t/evil.test',
    '/.//evil.test',
    '/x/..//evil.test',
  ])('ignores unsafe next %j', async (next) => {
    const creds = makeTestCredentials();
    const instance = createTestApp();
    await registerAndVerify(instance, creds);
    nextIdentity = makeIdentity({ email: creds.email.toLowerCase() });

    const redirect = await signInWithProvider(httpsClient(instance), { next });
    expect(redirect.href).toBe(`${APP_URL}/lobby`);
  });
});
