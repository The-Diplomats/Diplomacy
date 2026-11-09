import type { LoginRequest, RegisterRequest, User } from '@diplomacy/contracts';
import { http, HttpResponse } from 'msw';

// In-memory accounts + a single "session" for local dev without the backend.
const accounts = new Map<string, { user: User; password: string }>([
  [
    'demo@diplomacy.gg',
    {
      user: { id: crypto.randomUUID(), email: 'demo@diplomacy.gg', username: 'demo' },
      password: 'password123',
    },
  ],
]);
let sessionUser: User | null = null;

const problem = (status: number, title: string, detail?: string) =>
  HttpResponse.json({ title, status, ...(detail && { detail }) }, { status });

function findByIdentifier(identifier: string) {
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
    sessionUser = account.user;
    return HttpResponse.json(account.user);
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { email, username, password } = (await request.json()) as RegisterRequest;
    const emailKey = email.trim().toLowerCase();
    const usernameKey = username.trim();
    if (accounts.has(emailKey) || findByIdentifier(usernameKey)) {
      return problem(409, 'Conflict', 'An account with this email or username already exists.');
    }
    const user: User = { id: crypto.randomUUID(), email: emailKey, username: usernameKey };
    accounts.set(emailKey, { user, password });
    sessionUser = user;
    return HttpResponse.json(user, { status: 201 });
  }),

  http.post('/api/auth/logout', () => {
    sessionUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
