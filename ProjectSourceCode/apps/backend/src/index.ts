import { createApp } from './app.js';
import { logger } from './log.js';

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err, port }, 'backend failed to start');
    process.exit(1);
  }
  logger.info({ port }, 'backend listening');
});
