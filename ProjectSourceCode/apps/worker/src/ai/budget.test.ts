import { type LlmClient, LlmResponseError, SMOKE_REQUEST } from '@diplomacy/ai';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import {
  createTokenBudget,
  type TokenBudget,
  TokenBudgetExceededError,
  withTokenBudget,
} from './budget.js';

function recordingBudget(available = true) {
  const recorded: number[] = [];
  const budget: TokenBudget = {
    async assertAvailable() {
      if (!available) {
        throw new TokenBudgetExceededError(10, 10);
      }
    },
    async record(tokens) {
      recorded.push(tokens);
    },
  };
  return { budget, recorded };
}

function fakeLlm(complete: LlmClient['complete']): LlmClient {
  return { model: 'test-model', complete };
}

const usage = { promptTokens: 30, completionTokens: 10, reasoningTokens: 4, totalTokens: 40 };

describe('withTokenBudget', () => {
  test('records the tokens of a successful call', async () => {
    const { budget, recorded } = recordingBudget();
    const llm = withTokenBudget(
      fakeLlm(async <T>() => ({ data: { status: 'ok' } as T, usage })),
      budget,
    );

    await llm.complete(SMOKE_REQUEST);

    expect(recorded).toEqual([40]);
  });

  test('records the tokens billed for an unusable answer', async () => {
    const { budget, recorded } = recordingBudget();
    const llm = withTokenBudget(
      fakeLlm(async () => {
        throw new LlmResponseError('cut off', 'length', 256);
      }),
      budget,
    );

    await expect(llm.complete(SMOKE_REQUEST)).rejects.toBeInstanceOf(LlmResponseError);
    expect(recorded).toEqual([256]);
  });

  test('does not call the LLM once the budget is used up', async () => {
    const { budget } = recordingBudget(false);
    let called = false;
    const llm = withTokenBudget(
      fakeLlm(async <T>() => {
        called = true;
        return { data: {} as T, usage };
      }),
      budget,
    );

    await expect(llm.complete(SMOKE_REQUEST)).rejects.toBeInstanceOf(TokenBudgetExceededError);
    expect(called).toBe(false);
  });
});

const redisUrl = process.env.REDIS_URL;

describe.skipIf(!redisUrl?.trim())('createTokenBudget', () => {
  let redis: Redis;
  const day = new Date('2000-01-01T12:00:00Z');
  const key = 'llm:tokens:2000-01-01';

  beforeAll(async () => {
    redis = new Redis(redisUrl!);
    await redis.del(key);
  });

  afterAll(async () => {
    await redis.del(key);
    redis.disconnect();
  });

  test('allows calls until the day total reaches the limit', async () => {
    const budget = createTokenBudget(redis, 100, () => day);

    await budget.assertAvailable();
    await budget.record(60);
    await budget.assertAvailable();
    await budget.record(40);

    await expect(budget.assertAvailable()).rejects.toBeInstanceOf(TokenBudgetExceededError);
    expect(await redis.ttl(key)).toBeGreaterThan(0);
  });
});
