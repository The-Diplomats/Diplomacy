import { createDbClient } from '@diplomacy/db';

import { logger } from '../log.js';
import { SCENARIOS } from './scenarios/index.js';

const name = process.argv[2];
const scenario = name && Object.hasOwn(SCENARIOS, name) ? SCENARIOS[name] : undefined;
if (!scenario) {
  logger.error({ name, available: Object.keys(SCENARIOS) }, 'unknown scenario');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  logger.error('DATABASE_URL is required');
  process.exit(1);
}

const client = createDbClient(databaseUrl);
try {
  await scenario(client);
  logger.info({ scenario: name }, 'scenario seeded');
} catch (err) {
  logger.error({ err, scenario: name }, 'scenario failed');
  process.exitCode = 1;
} finally {
  await client.$client.end();
}
