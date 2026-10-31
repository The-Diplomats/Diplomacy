import { createApp } from './app.js';
import { logger } from './log.js';

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(port, () => {
  logger.info({ port }, 'backend listening');
});
