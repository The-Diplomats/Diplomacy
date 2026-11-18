import { LlmRateLimitError } from '@diplomacy/ai';
import { addAiTurn, type AiTurnJobData, createAiTurnsQueue } from '@diplomacy/queues';
import { type Job, type Queue, type Worker } from 'bullmq';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createAiTurnsWorker } from './worker.js';

const redisUrl = process.env.REDIS_URL;

describe.skipIf(!redisUrl?.trim())('ai-turns worker', () => {
  let connection: Redis;
  let queue: Queue<AiTurnJobData>;
  let worker: Worker<AiTurnJobData>;
  const calls: Job<AiTurnJobData>[] = [];

  beforeAll(async () => {
    // A separate logical DB, so a running dev worker can't take the test's jobs.
    connection = new Redis(redisUrl!, { db: 15, maxRetriesPerRequest: null });
    queue = createAiTurnsQueue(connection);
    await queue.obliterate({ force: true });
    worker = createAiTurnsWorker({
      connection,
      queue,
      async handleAiTurn(job) {
        calls.push(job);
        if (calls.length === 1) {
          throw new LlmRateLimitError(50);
        }
      },
    });
  });

  afterAll(async () => {
    await worker.close();
    await queue.obliterate({ force: true });
    await queue.close();
    connection.disconnect();
  });

  test('a rate-limited turn is requeued and then completes without using an attempt', async () => {
    const completed = new Promise<Job<AiTurnJobData>>((resolve) =>
      worker.once('completed', resolve),
    );
    const data: AiTurnJobData = { gameId: 'game-1', phaseId: 'phase-1', power: 'france' };

    await addAiTurn(queue, data);
    const job = await completed;

    expect(calls).toHaveLength(2);
    expect(job.id).toBe('ai-take-turn-game-1-france-phase-1');
    expect(job.attemptsMade).toBe(1);
  });
});
