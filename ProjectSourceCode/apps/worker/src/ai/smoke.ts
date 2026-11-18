import { createLlmClient, readLlmConfig, SMOKE_REQUEST, type SmokeResult } from '@diplomacy/ai';

import { logger } from '../log.js';
import { createMockLlm } from './setup.js';

// One structured call against whatever LLM_BASE_URL points at; logs latency and billed tokens.
const mock = process.env.MOCK_AI === 'true' ? await createMockLlm(process.env) : null;
const config = readLlmConfig(mock ? { ...process.env, LLM_API_KEY: 'mock' } : process.env);
if (!config) {
  logger.error('Set LLM_API_KEY in apps/worker/.env, or MOCK_AI=true to check the mock.');
  process.exit(1);
}

const llm = mock?.llm ?? createLlmClient(config);
const started = performance.now();
try {
  const result = await llm.complete<SmokeResult>(SMOKE_REQUEST);
  logger.info(
    {
      host: new URL(config.baseUrl).host,
      model: config.model,
      mock: Boolean(mock),
      latencyMs: Math.round(performance.now() - started),
      data: result.data,
      usage: result.usage,
    },
    'ai smoke ok',
  );
} catch (err) {
  logger.error({ err }, 'ai smoke failed');
  process.exitCode = 1;
} finally {
  mock?.close();
}
