import { createLlmClient, type LlmClient, readLlmConfig } from '@diplomacy/ai';
import type Redis from 'ioredis';

import { createTokenBudget, withTokenBudget } from './budget.js';

export type AiMode = 'mock' | 'live' | 'disabled';

export interface AiSetup {
  mode: AiMode;
  /** Null when disabled: AI turns fall back to phase-default orders. */
  llm: LlmClient | null;
  close(): void;
}

/** Serves fixtures through the real client by intercepting its HTTP calls. */
export async function createMockLlm(
  env: NodeJS.ProcessEnv,
): Promise<{ llm: LlmClient; close(): void }> {
  const { createMockLlmServer } = await import('@diplomacy/ai/mock');
  const config = readLlmConfig({ ...env, LLM_API_KEY: 'mock' })!;
  const server = createMockLlmServer(config.baseUrl);
  server.listen({ onUnhandledFrame: 'bypass' });
  return { llm: createLlmClient(config), close: () => server.close() };
}

export async function setupAi(env: NodeJS.ProcessEnv, redis: Redis): Promise<AiSetup> {
  if (env.MOCK_AI === 'true') {
    if (env.NODE_ENV === 'production') {
      throw new Error('MOCK_AI is not allowed when NODE_ENV=production');
    }
    const mock = await createMockLlm(env);
    return { mode: 'mock', ...mock };
  }

  const config = readLlmConfig(env);
  if (!config) {
    return { mode: 'disabled', llm: null, close() {} };
  }

  const dailyLimit = Number(env.LLM_DAILY_TOKEN_BUDGET);
  if (!Number.isInteger(dailyLimit) || dailyLimit <= 0) {
    throw new Error('LLM_DAILY_TOKEN_BUDGET must be a positive integer when LLM_API_KEY is set');
  }
  const llm = withTokenBudget(createLlmClient(config), createTokenBudget(redis, dailyLimit));
  return { mode: 'live', llm, close() {} };
}
