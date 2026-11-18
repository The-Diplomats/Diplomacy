import { DEFAULT_LLM_BASE_URL, SMOKE_REQUEST, type SmokeResult } from '@diplomacy/ai';
import Redis from 'ioredis';

import { logger } from '../log.js';
import { setupAi } from './setup.js';

// One structured call through the worker's own setup, so live calls count against the daily budget.
const redisUrl = process.env.REDIS_URL;
if (!redisUrl?.trim()) {
  logger.error('REDIS_URL is required');
  process.exit(1);
}

// Connects on the first command; mock mode sends none, so it runs without Redis
const redis = new Redis(redisUrl, { lazyConnect: true });
try {
  const ai = await setupAi(process.env, redis);
  try {
    if (!ai.llm) {
      throw new Error('Set LLM_API_KEY in apps/worker/.env, or MOCK_AI=true to check the mock.');
    }
    const started = performance.now();
    const result = await ai.llm.complete<SmokeResult>(SMOKE_REQUEST);
    logger.info(
      {
        mode: ai.mode,
        host: new URL(process.env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL).host,
        model: ai.llm.model,
        latencyMs: Math.round(performance.now() - started),
        data: result.data,
        usage: result.usage,
      },
      'ai smoke ok',
    );
  } finally {
    ai.close();
  }
} catch (err) {
  logger.error({ err }, 'ai smoke failed');
  process.exitCode = 1;
} finally {
  redis.disconnect();
}
