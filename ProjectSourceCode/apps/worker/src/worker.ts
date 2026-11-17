import { type BroadcastJobData, NOTIFICATIONS_QUEUE_NAME } from '@diplomacy/queues';
import { type ConnectionOptions, type Job, Worker } from 'bullmq';

import { logger } from './log.js';

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
    {
      connection: options.connection,
      // Hosted Redis bills per command, and an idle worker polls on these timers. New jobs still
      // wake the worker immediately; drainDelay only sets how often an empty queue re-polls.
      drainDelay: 60,
      stalledInterval: 5 * 60_000,
    },
  );
}
