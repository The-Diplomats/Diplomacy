import type { DbClient } from '@diplomacy/db';

import { requirePassword, type ScenarioUser, upsertVerifiedUser } from './users.js';

export const CANARY_USER: ScenarioUser = {
  id: '3f6c2a1e-8d4b-4f0a-9c7e-0ca0a0000001',
  email: 'canary@diplomacy.gg',
  username: 'canary',
};

/**
 * The prod smoke-test account, created once by hand. diplomacy.gg receives no mail, so the
 * account can't be verified through sign-up.
 */
export async function seedCanary(db: DbClient): Promise<void> {
  await upsertVerifiedUser(db, CANARY_USER, requirePassword('CANARY_PASSWORD'));
}
