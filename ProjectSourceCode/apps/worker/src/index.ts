import Redis from 'ioredis';

import { createEmitter } from './emitter.js';
import { createBroadcastHandler } from './handlers/broadcast.js';
import { logger } from './log.js';
import { createWorker } from './worker.js';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl?.trim()) {
  logger.error('REDIS_URL is required');
  process.exit(1);
}

const bullmqConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const emitterConnection = new Redis(redisUrl);

const emitter = createEmitter(emitterConnection);
const handleBroadcast = createBroadcastHandler(emitter);
const worker = createWorker({
  connection: bullmqConnection,
  handleBroadcast,
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err }, 'job failed');
});

worker.on('error', (err) => {
  logger.error({ err }, 'worker error');
});

bullmqConnection.on('error', (err) => {
  logger.error({ err }, 'bullmq redis connection error');
});

emitterConnection.on('error', (err) => {
  logger.error({ err }, 'emitter redis connection error');
});

logger.info('worker started, waiting for notifications jobs');

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'worker shutting down');

  const forceExit = setTimeout(() => {
    logger.error('shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await worker.close();
    emitterConnection.disconnect();
    bullmqConnection.disconnect();
    clearTimeout(forceExit);
    logger.info('worker shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'worker shutdown error');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
