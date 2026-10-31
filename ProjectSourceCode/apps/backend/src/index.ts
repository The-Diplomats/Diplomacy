import { createApp } from './app.js';
import { logger } from './log.js';

const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!databaseUrl?.trim()) {
  logger.error('DATABASE_URL is required');
  process.exit(1);
}
if (!sessionSecret?.trim()) {
  logger.error('SESSION_SECRET is required');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3001);
const app = createApp({ databaseUrl, sessionSecret });

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err, port }, 'backend failed to start');
    process.exit(1);
  }
  logger.info({ port }, 'backend listening');
});
