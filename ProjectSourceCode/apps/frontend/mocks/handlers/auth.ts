import type { LoginRequest, RegisterRequest, User } from '@diplomacy/contracts';
import { http, HttpResponse } from 'msw';

// In-memory accounts + a single "session" for local dev without the backend.
const accounts = new Map<string, { user: User; password: string }>([
  [
    'demo@diplomacy.gg',
    { user: { id: crypto.randomUUID(), email: 'demo@diplomacy.gg' }, password: 'password123' },
  ],
]);
let sessionUser: User | null = null;

const problem = (status: number, title: string, detail?: string) =>
  HttpResponse.json({ title, status, ...(detail && { detail }) }, { status });

export const authHandlers = [
  http.get('/api/auth/me', () =>
    sessionUser ? HttpResponse.json(sessionUser) : problem(401, 'Not authenticated'),
  ),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as LoginRequest;
    const account = accounts.get(email.trim().toLowerCase());
    if (!account || account.password !== password) {
      return problem(401, 'Unauthorized', 'Invalid email or password.');
    }
    sessionUser = account.user;
    return HttpResponse.json(account.user);
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { email, password } = (await request.json()) as RegisterRequest;
    const key = email.trim().toLowerCase();
    if (accounts.has(key)) {
      return problem(409, 'Conflict', 'An account with this email already exists.');
    }
    const user: User = { id: crypto.randomUUID(), email: key };
    accounts.set(key, { user, password });
    sessionUser = user;
    return HttpResponse.json(user, { status: 201 });
  }),

  http.post('/api/auth/logout', () => {
    sessionUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
