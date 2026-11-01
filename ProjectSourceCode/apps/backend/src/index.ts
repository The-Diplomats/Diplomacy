import { createServer } from 'node:http';

import cors from 'cors';

import { createApp } from './app.js';
import { logger } from './log.js';
import { createSessionMiddleware } from './middleware/session.js';
import { createSocketServer } from './socket.js';

const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const frontendOriginsRaw = process.env.FRONTEND_ORIGINS;

if (!databaseUrl?.trim()) {
  logger.error('DATABASE_URL is required');
  process.exit(1);
}
if (!sessionSecret?.trim()) {
  logger.error('SESSION_SECRET is required');
  process.exit(1);
}
if (!frontendOriginsRaw?.trim()) {
  logger.error('FRONTEND_ORIGINS is required (comma-separated list of allowed origins)');
  process.exit(1);
}

const origins = frontendOriginsRaw
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

const redisUrl = process.env.REDIS_URL?.trim() || undefined;
const port = Number(process.env.PORT ?? 3001);

const corsMiddleware = cors({ origin: origins, credentials: true });
const { middleware: sessionMiddleware, pool } = createSessionMiddleware(databaseUrl, sessionSecret);
const app = createApp({ corsMiddleware, sessionMiddleware });
const httpServer = createServer(app);
const socketServer = createSocketServer(httpServer, {
  sessionMiddleware,
  origins,
  redisUrl,
});

httpServer.on('error', (err) => {
  logger.error({ err, port }, 'backend failed to start');
  process.exit(1);
});

httpServer.listen(port, () => {
  logger.info({ port }, 'backend listening');
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'backend shutting down');

  const forceExit = setTimeout(() => {
    logger.error('shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await socketServer.close();
    await pool.end();
    clearTimeout(forceExit);
    logger.info('backend shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'backend shutdown error');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
