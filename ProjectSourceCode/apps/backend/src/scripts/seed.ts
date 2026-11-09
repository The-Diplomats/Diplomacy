import { createDbClient } from '@diplomacy/db';

import { hashPassword } from '../auth/password.js';
import { logger } from '../log.js';
import { createUserRepository } from '../repositories/users.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed in production');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  throw new Error('DATABASE_URL is required');
}

const TEAMMATES = [
  { email: 'brynne@diplomacy.gg', username: 'brynne' },
  { email: 'nabl@diplomacy.gg', username: 'nate' },
  { email: 'deven@diplomacy.gg', username: 'deven' },
  { email: 'rez@diplomacy.gg', username: 'rez' },
  { email: 'justin@diplomacy.gg', username: 'justin' },
];

const SHARED_PASSWORD = 'diplomacy-dev-shared';

async function main(): Promise<void> {
  const client = createDbClient(databaseUrl!);
  const users = createUserRepository(client);

  logger.info('seeding dev users');
  const passwordHash = await hashPassword(SHARED_PASSWORD);

  for (const { email, username } of TEAMMATES) {
    const existing = await users.findByEmail(email);
    if (existing) {
      logger.info({ email }, 'already seeded, skipping');
      continue;
    }
    const user = await users.create({ email, username, passwordHash });
    if (!user) {
      logger.warn({ email, username }, 'conflict on insert, skipping');
      continue;
    }
    await users.markEmailVerified(user.id);
    logger.info({ email, username }, 'seeded');
  }

  logger.info({ password: SHARED_PASSWORD }, 'done. log in with any seeded email or username.');
  await client.$client.end();
}

main().catch((err: unknown) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
