import type { Power } from '@diplomacy/game-types';
import { type ConnectionOptions, Queue } from 'bullmq';

// Separate from game-clock jobs so throttling AI turns never delays a phase deadline.
export const AI_TURNS_QUEUE_NAME = 'ai-turns';

export interface AiTurnJobData {
  gameId: string;
  phaseId: string;
  power: Power;
}

export function createAiTurnsQueue(connection: ConnectionOptions): Queue<AiTurnJobData> {
  return new Queue<AiTurnJobData>(AI_TURNS_QUEUE_NAME, { connection });
}

/** One AI turn per game, power and phase, so a duplicate enqueue is a no-op. */
export function aiTurnJobId({ gameId, phaseId, power }: AiTurnJobData): string {
  return `ai-take-turn-${gameId}-${power}-${phaseId}`;
}

export async function addAiTurn(queue: Queue<AiTurnJobData>, data: AiTurnJobData, delayMs = 0) {
  return queue.add('ai-take-turn', data, { jobId: aiTurnJobId(data), delay: delayMs });
}
