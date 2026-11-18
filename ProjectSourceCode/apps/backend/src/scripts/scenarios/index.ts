import type { DbClient } from '@diplomacy/db';

import { seedCanary } from './canary.js';
import { seedE2eAuth } from './e2e-auth.js';

export const SCENARIOS: Record<string, (db: DbClient) => Promise<void>> = {
  canary: seedCanary,
  'e2e-auth': seedE2eAuth,
};
