import {
  type LlmClient,
  LlmResponseError,
  type StructuredRequest,
  type StructuredResult,
} from '@diplomacy/ai';
import type Redis from 'ioredis';

import { logger } from '../log.js';

const KEY_TTL_SECONDS = 2 * 24 * 60 * 60;

export class TokenBudgetExceededError extends Error {
  constructor(used: number, limit: number) {
    super(`daily LLM token budget used up (${used} of ${limit})`);
    this.name = 'TokenBudgetExceededError';
  }
}

export interface TokenBudget {
  assertAvailable(): Promise<void>;
  record(tokens: number): Promise<void>;
}

/** Counts tokens per UTC day in Redis, so every worker replica shares one ceiling. */
export function createTokenBudget(
  redis: Redis,
  dailyLimit: number,
  now = () => new Date(),
): TokenBudget {
  const key = () => `llm:tokens:${now().toISOString().slice(0, 10)}`;

  return {
    async assertAvailable() {
      const used = Number(await redis.get(key()));
      if (used >= dailyLimit) {
        throw new TokenBudgetExceededError(used, dailyLimit);
      }
    },
    async record(tokens) {
      const dayKey = key();
      await redis.multi().incrby(dayKey, tokens).expire(dayKey, KEY_TTL_SECONDS).exec();
    },
  };
}

/** Every call checks the budget first and records what the provider billed. */
export function withTokenBudget(llm: LlmClient, budget: TokenBudget): LlmClient {
  return {
    model: llm.model,
    async complete<T>(request: StructuredRequest): Promise<StructuredResult<T>> {
      await budget.assertAvailable();
      try {
        const result = await llm.complete<T>(request);
        await budget.record(result.usage.totalTokens);
        logger.info({ model: llm.model, schema: request.name, usage: result.usage }, 'llm call');
        return result;
      } catch (error) {
        if (error instanceof LlmResponseError) {
          await budget.record(error.totalTokens);
        }
        throw error;
      }
    },
  };
}
