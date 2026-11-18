import type { DbClient } from '@diplomacy/db';

import { requirePassword, type ScenarioUser, upsertVerifiedUser } from './users.js';

export const E2E_USER: ScenarioUser = {
  id: '3f6c2a1e-8d4b-4f0a-9c7e-0e2e00000001',
  email: 'e2e@diplomacy.gg',
  username: 'e2e_user',
};

/** A verified user for the auth specs, on dev, stage and the PR stack. */
export async function seedE2eAuth(db: DbClient): Promise<void> {
  // Prod smoke tests use the canary; this user's password lives in dev and stage secrets.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed the e2e user in production');
  }
  await upsertVerifiedUser(db, E2E_USER, requirePassword('E2E_USER_PASSWORD'));
}
