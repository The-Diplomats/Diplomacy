import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createLlmClient, type LlmClient } from './client.js';
import { createMockLlmServer } from './mock.js';
import { SMOKE_REQUEST, type SmokeResult } from './smoke.js';

const BASE_URL = 'https://llm.test/v1';
const server = createMockLlmServer(BASE_URL);
let client: LlmClient;

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
  client = createLlmClient({
    apiKey: 'mock',
    baseUrl: BASE_URL,
    model: 'test-model',
    timeoutMs: 5_000,
  });
});
afterAll(() => server.close());

describe('createMockLlmServer', () => {
  test('answers with the fixture named after the schema', async () => {
    const result = await client.complete<SmokeResult>(SMOKE_REQUEST);

    expect(result.data).toEqual({ status: 'ok' });
  });

  test('fails a request that has no fixture', async () => {
    await expect(client.complete({ ...SMOKE_REQUEST, name: 'missing' })).rejects.toThrow(
      /no fixture/,
    );
  });
});
