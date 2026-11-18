import { LlmRateLimitError } from '@diplomacy/ai';
import { addAiTurn, type AiTurnJobData, createAiTurnsQueue } from '@diplomacy/queues';
import { type Job, type Queue, type Worker } from 'bullmq';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createAiTurnsWorker } from './worker.js';

const redisUrl = process.env.REDIS_URL;
const COOLDOWN_MS = 1_000;

describe.skipIf(!redisUrl?.trim())('ai-turns worker', () => {
  let connection: Redis;
  let queue: Queue<AiTurnJobData>;
  let workers: Worker<AiTurnJobData>[];
  const callTimes: number[] = [];

  beforeAll(async () => {
    // A separate logical DB, so a running dev worker can't take the test's jobs. Set in the URL
    // because a database in REDIS_URL would win over a `db` option.
    const url = new URL(redisUrl!);
    url.pathname = '/15';
    connection = new Redis(url.toString(), { maxRetriesPerRequest: null });
    queue = createAiTurnsQueue(connection);
    await queue.obliterate({ force: true });
    const handleAiTurn = async () => {
      callTimes.push(Date.now());
      if (callTimes.length === 1) {
        throw new LlmRateLimitError(COOLDOWN_MS);
      }
    };
    workers = [1, 2].map(() => createAiTurnsWorker({ connection, queue, handleAiTurn }));
  });

  afterAll(async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    await queue.obliterate({ force: true });
    await queue.close();
    connection.disconnect();
  });

  test('a rate-limited turn waits out the cooldown on every worker, then completes without using an attempt', async () => {
    const completed = new Promise<Job<AiTurnJobData>>((resolve) => {
      for (const worker of workers) {
        worker.once('completed', resolve);
      }
    });
    const data: AiTurnJobData = { gameId: 'game-1', phaseId: 'phase-1', power: 'france' };

    await addAiTurn(queue, data);
    const job = await completed;

    expect(callTimes).toHaveLength(2);
    expect(callTimes[1]! - callTimes[0]!).toBeGreaterThanOrEqual(COOLDOWN_MS - 50);
    expect(job.id).toBe('ai-take-turn-game-1-france-phase-1');
    expect(job.attemptsMade).toBe(1);
  });
});
