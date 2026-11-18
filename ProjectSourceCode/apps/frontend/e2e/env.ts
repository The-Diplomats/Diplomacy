export const appUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
export const apiUrl = process.env.E2E_API_URL ?? `${appUrl}/api`;

/** The seeded `e2e-auth` user, or the canary account on prod. */
export function credentials(): { identifier: string; password: string } {
  const password = process.env.E2E_PASSWORD;
  if (!password) {
    throw new Error('E2E_PASSWORD is required');
  }
  return { identifier: process.env.E2E_IDENTIFIER ?? 'e2e@diplomacy.gg', password };
}
