import type {
  LoginRequest,
  OAuthCompleteRequest,
  OAuthLoginRequest,
  OAuthPendingSignup,
  OAuthProvider,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  RegisterRequest,
  RegisterResendRequest,
  RegisterVerifyRequest,
  User,
} from '@diplomacy/contracts';
import { http, HttpResponse } from 'msw';

interface MockAccount {
  user: User;
  password: string;
  verified: boolean;
}

const accounts = new Map<string, MockAccount>([
  [
    'demo@diplomacy.gg',
    {
      user: { id: crypto.randomUUID(), email: 'demo@diplomacy.gg', username: 'demo' },
      password: 'password123',
      verified: true,
    },
  ],
]);
let sessionUser: User | null = null;
let pendingOAuthSignup: OAuthPendingSignup | null = null;

/** Mock accepts any 6-digit code; type anything like 123456 to verify in dev. */
const ACCEPTED_CODE_PATTERN = /^\d{6}$/;

const problem = (status: number, title: string, detail?: string) =>
  HttpResponse.json({ title, status, ...(detail && { detail }) }, { status });

function findByIdentifier(identifier: string): MockAccount | undefined {
  const lc = identifier.trim().toLowerCase();
  for (const account of accounts.values()) {
    if (account.user.email.toLowerCase() === lc || account.user.username.toLowerCase() === lc) {
      return account;
    }
  }
  return undefined;
}

export const authHandlers = [
  http.get('/api/auth/me', () =>
    sessionUser ? HttpResponse.json(sessionUser) : problem(401, 'Not authenticated'),
  ),

  http.post('/api/auth/login', async ({ request }) => {
    const { identifier, password } = (await request.json()) as LoginRequest;
    const account = findByIdentifier(identifier);
    if (!account || account.password !== password) {
      return problem(401, 'Unauthorized', 'Invalid credentials.');
    }
    if (!account.verified) {
      return problem(403, 'Forbidden', 'Please verify your email before signing in.');
    }
    sessionUser = account.user;
    return HttpResponse.json(account.user);
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { email, username, password } = (await request.json()) as RegisterRequest;
    const emailKey = email.trim().toLowerCase();
    const usernameKey = username.trim();

    const existing = accounts.get(emailKey) ?? findByIdentifier(usernameKey);
    if (!existing) {
      const user: User = { id: crypto.randomUUID(), email: emailKey, username: usernameKey };
      accounts.set(emailKey, { user, password, verified: false });
    }
    return new HttpResponse(null, { status: 202 });
  }),

  http.post('/api/auth/register/verify', async ({ request }) => {
    const { identifier, code } = (await request.json()) as RegisterVerifyRequest;
    if (!ACCEPTED_CODE_PATTERN.test(code)) {
      return problem(400, 'Bad Request', 'Invalid or expired code.');
    }
    const account = findByIdentifier(identifier);
    if (!account || account.verified) {
      return problem(400, 'Bad Request', 'Invalid or expired code.');
    }
    account.verified = true;
    sessionUser = account.user;
    return HttpResponse.json(account.user);
  }),

  http.post('/api/auth/register/resend', async ({ request }) => {
    void ((await request.json()) as RegisterResendRequest);
    return new HttpResponse(null, { status: 202 });
  }),

  http.post('/api/auth/password-reset', async ({ request }) => {
    void ((await request.json()) as PasswordResetRequest);
    return new HttpResponse(null, { status: 202 });
  }),

  http.post('/api/auth/password-reset/verify', async ({ request }) => {
    const { email, code, newPassword } = (await request.json()) as PasswordResetVerifyRequest;
    if (!ACCEPTED_CODE_PATTERN.test(code)) {
      return problem(400, 'Bad Request', 'Invalid or expired code.');
    }
    const account = accounts.get(email.trim().toLowerCase());
    if (!account || !account.verified) {
      return problem(400, 'Bad Request', 'Invalid or expired code.');
    }
    account.password = newPassword;
    sessionUser = account.user;
    return HttpResponse.json(account.user);
  }),

  http.get('/api/auth/oauth/providers', () =>
    HttpResponse.json({ providers: ['google', 'microsoft'] satisfies OAuthProvider[] }),
  ),

  // No real provider in mock mode: every OAuth sign-in is a brand-new identity
  // that lands straight on the username picker.
  http.post('/api/auth/oauth/:provider/login', async ({ params, request }) => {
    const { next } = (await request.json()) as OAuthLoginRequest;
    const provider = params.provider as OAuthProvider;
    pendingOAuthSignup = {
      provider,
      email: `${provider}-user@example.com`,
      suggestedUsername: `${provider}_user`,
    };
    const url = new URL('/auth/oauth/complete', window.location.origin);
    if (next) {
      url.searchParams.set('next', next);
    }
    return HttpResponse.json({ url: url.href });
  }),

  http.get('/api/auth/oauth/pending', () =>
    pendingOAuthSignup
      ? HttpResponse.json(pendingOAuthSignup)
      : problem(404, 'Not Found', 'Your sign-in expired. Please start again.'),
  ),

  http.post('/api/auth/oauth/complete', async ({ request }) => {
    const { username } = (await request.json()) as OAuthCompleteRequest;
    if (!pendingOAuthSignup) {
      return problem(404, 'Not Found', 'Your sign-in expired. Please start again.');
    }
    if (findByIdentifier(username)) {
      return problem(409, 'Conflict', 'That username is taken.');
    }
    const user: User = { id: crypto.randomUUID(), email: pendingOAuthSignup.email, username };
    accounts.set(user.email, { user, password: crypto.randomUUID(), verified: true });
    pendingOAuthSignup = null;
    sessionUser = user;
    return HttpResponse.json(user);
  }),

  http.post('/api/auth/logout', () => {
    sessionUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
