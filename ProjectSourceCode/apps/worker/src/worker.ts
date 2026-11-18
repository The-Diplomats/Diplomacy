import { LlmRateLimitError } from '@diplomacy/ai';
import {
  AI_TURNS_QUEUE_NAME,
  type AiTurnJobData,
  type BroadcastJobData,
  NOTIFICATIONS_QUEUE_NAME,
} from '@diplomacy/queues';
import { type ConnectionOptions, type Job, type Queue, Worker } from 'bullmq';

import { logger } from './log.js';

// Hosted Redis bills per command, and an idle worker polls on these timers. New jobs still
// wake the worker immediately; drainDelay only sets how often an empty queue re-polls.
const IDLE_POLLING = {
  drainDelay: 60,
  stalledInterval: 5 * 60_000,
};

interface WorkerOptions {
  connection: ConnectionOptions;
  handleBroadcast: (job: Job<BroadcastJobData>) => Promise<void>;
}

export function createWorker(options: WorkerOptions): Worker<BroadcastJobData> {
  return new Worker<BroadcastJobData>(
    NOTIFICATIONS_QUEUE_NAME,
    async (job) => {
      if (job.name === 'broadcast') {
        return options.handleBroadcast(job);
      }
      logger.warn({ jobName: job.name }, 'unknown job type, ignoring');
    },
    { connection: options.connection, ...IDLE_POLLING },
  );
}

interface AiTurnsWorkerOptions {
  connection: ConnectionOptions;
  queue: Queue<AiTurnJobData>;
  handleAiTurn: (job: Job<AiTurnJobData>) => Promise<void>;
}

export function createAiTurnsWorker(options: AiTurnsWorkerOptions): Worker<AiTurnJobData> {
  return new Worker<AiTurnJobData>(
    AI_TURNS_QUEUE_NAME,
    async (job) => {
      try {
        await options.handleAiTurn(job);
      } catch (error) {
        if (error instanceof LlmRateLimitError) {
          // Pauses this queue for the provider's window and requeues the job without using an attempt.
          await options.queue.rateLimit(error.retryAfterMs);
          throw Worker.RateLimitError();
        }
        throw error;
      }
    },
    {
      connection: options.connection,
      // One turn at a time keeps bursts under the provider's per-minute limits.
      concurrency: 1,
      // Groq's free-tier request limit. BullMQ only honors a queue.rateLimit cooldown across
      // workers when a limiter is set.
      limiter: { max: 30, duration: 60_000 },
      ...IDLE_POLLING,
    },
  );
}
