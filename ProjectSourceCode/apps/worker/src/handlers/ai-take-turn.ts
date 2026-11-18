import type { LlmClient } from '@diplomacy/ai';
import type { AiTurnJobData } from '@diplomacy/queues';
import type { Job } from 'bullmq';

import { logger } from '../log.js';

/** Stub for the AI turn flow in DESIGN_DOC.md §11: logs the request and completes. */
export function createAiTurnHandler(llm: LlmClient | null) {
  return async (job: Job<AiTurnJobData>): Promise<void> => {
    const { gameId, phaseId, power } = job.data;
    logger.info(
      { jobId: job.id, gameId, phaseId, power, model: llm?.model ?? null },
      'ai turn requested',
    );
  };
}
