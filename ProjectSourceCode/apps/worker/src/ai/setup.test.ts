import type Redis from 'ioredis';
import { describe, expect, test } from 'vitest';

import { setupAi } from './setup.js';

// setupAi only stores the connection; nothing here sends a command.
const redis = {} as Redis;

describe('setupAi', () => {
  test('refuses mock mode in production', async () => {
    await expect(setupAi({ MOCK_AI: 'true', NODE_ENV: 'production' }, redis)).rejects.toThrow(
      /MOCK_AI/,
    );
  });

  test('is disabled without a key', async () => {
    const ai = await setupAi({}, redis);

    expect(ai.mode).toBe('disabled');
    expect(ai.llm).toBeNull();
  });

  test('requires a daily token budget with a key', async () => {
    await expect(setupAi({ LLM_API_KEY: 'key' }, redis)).rejects.toThrow(/LLM_DAILY_TOKEN_BUDGET/);
  });

  test('is live with a key and a budget', async () => {
    const ai = await setupAi({ LLM_API_KEY: 'key', LLM_DAILY_TOKEN_BUDGET: '1000' }, redis);

    expect(ai.mode).toBe('live');
    expect(ai.llm?.model).toBe('openai/gpt-oss-20b');
  });
});
