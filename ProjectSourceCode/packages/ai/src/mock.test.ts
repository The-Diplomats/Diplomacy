import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createLlmClient, type LlmClient } from './client.js';
import { createMockLlmServer } from './mock.js';
import { SMOKE_REQUEST, type SmokeResult } from './smoke.js';

describe.each(['https://llm.test/v1', 'https://llm.test/v1/'])(
  'createMockLlmServer with base URL %s',
  (baseUrl) => {
    const server = createMockLlmServer(baseUrl);
    let client: LlmClient;

    beforeAll(() => {
      server.listen({ onUnhandledFrame: 'error' });
      client = createLlmClient({ apiKey: 'mock', baseUrl, model: 'test-model', timeoutMs: 5_000 });
    });
    afterAll(() => server.close());

    test('answers with the fixture named after the schema', async () => {
      const result = await client.complete<SmokeResult>(SMOKE_REQUEST);

      expect(result.data).toEqual({ status: 'ok' });
    });

    test('fails a request that has no fixture', async () => {
      await expect(client.complete({ ...SMOKE_REQUEST, name: 'missing' })).rejects.toThrow(
        /no fixture/,
      );
    });
  },
);
