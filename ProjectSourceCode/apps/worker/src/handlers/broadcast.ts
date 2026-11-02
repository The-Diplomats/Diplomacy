import type { ServerToClientEvents } from '@diplomacy/contracts';
import type { BroadcastJobData } from '@diplomacy/queues';
import type { Job } from 'bullmq';

import type { DiplomacyEmitter } from '../emitter.js';
import { logger } from '../log.js';

export function createBroadcastHandler(emitter: DiplomacyEmitter) {
  return async function handleBroadcast(job: Job<BroadcastJobData>) {
    const { event, payload } = job.data;
    logger.info({ jobId: job.id, event }, 'broadcasting event');
    // event + payload typed via addBroadcast at the producer site; cast at emission boundary.
    emitter.emit(event as keyof ServerToClientEvents, payload as never);
  };
}
