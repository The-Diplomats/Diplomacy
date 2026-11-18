import { createAiTurnsQueue } from '@diplomacy/queues';
import Redis from 'ioredis';

import { setupAi } from './ai/setup.js';
import { createEmitter } from './emitter.js';
import { createAiTurnHandler } from './handlers/ai-take-turn.js';
import { createBroadcastHandler } from './handlers/broadcast.js';
import { logger } from './log.js';
import { createAiTurnsWorker, createWorker } from './worker.js';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl?.trim()) {
  logger.error('REDIS_URL is required');
  process.exit(1);
}

const bullmqConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
// Plain commands: the Socket.IO emitter and the LLM token budget.
const commandConnection = new Redis(redisUrl);

const ai = await setupAi(process.env, commandConnection).catch((err: unknown) => {
  logger.error({ err }, 'AI setup failed');
  process.exit(1);
});
if (ai.mode === 'disabled') {
  logger.warn('LLM_API_KEY not set and MOCK_AI off: AI turns will use phase-default orders');
}

const emitter = createEmitter(commandConnection);
const handleBroadcast = createBroadcastHandler(emitter);
const worker = createWorker({
  connection: bullmqConnection,
  handleBroadcast,
});
const aiTurnsQueue = createAiTurnsQueue(bullmqConnection);
const aiTurnsWorker = createAiTurnsWorker({
  connection: bullmqConnection,
  queue: aiTurnsQueue,
  handleAiTurn: createAiTurnHandler(ai.llm),
});

for (const queueWorker of [worker, aiTurnsWorker]) {
  queueWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'job completed');
  });

  queueWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err }, 'job failed');
  });

  queueWorker.on('error', (err) => {
    logger.error({ err }, 'worker error');
  });
}

bullmqConnection.on('error', (err) => {
  logger.error({ err }, 'bullmq redis connection error');
});

commandConnection.on('error', (err) => {
  logger.error({ err }, 'command redis connection error');
});

logger.info({ aiMode: ai.mode }, 'worker started, waiting for notifications and ai-turns jobs');

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'worker shutting down');

  const forceExit = setTimeout(() => {
    logger.error('shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await Promise.all([worker.close(), aiTurnsWorker.close()]);
    await aiTurnsQueue.close();
    ai.close();
    commandConnection.disconnect();
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
