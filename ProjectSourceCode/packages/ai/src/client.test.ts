import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { createLlmClient, type LlmClient } from './client.js';
import { LlmRateLimitError, LlmResponseError } from './errors.js';
import { SMOKE_REQUEST, type SmokeResult } from './smoke.js';

const BASE_URL = 'https://llm.test/v1';
const COMPLETIONS_URL = `${BASE_URL}/chat/completions`;

const server = setupServer();
let client: LlmClient;

function completion(content: string | null, finishReason = 'stop') {
  return {
    id: 'test',
    object: 'chat.completion',
    created: 0,
    model: 'test-model',
    choices: [{ index: 0, finish_reason: finishReason, message: { role: 'assistant', content } }],
    usage: {
      prompt_tokens: 40,
      completion_tokens: 12,
      total_tokens: 52,
      completion_tokens_details: { reasoning_tokens: 8 },
    },
  };
}

beforeAll(() => {
  // The SDK captures fetch at construction, so the client must be created after listen().
  server.listen({ onUnhandledFrame: 'error' });
  client = createLlmClient({
    apiKey: 'test-key',
    baseUrl: BASE_URL,
    model: 'test-model',
    timeoutMs: 5_000,
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createLlmClient', () => {
  test('sends a strict structured request and returns parsed data with usage', async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(COMPLETIONS_URL, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(completion('{"status":"ok"}'));
      }),
    );

    const result = await client.complete<SmokeResult>(SMOKE_REQUEST);

    expect(result.data).toEqual({ status: 'ok' });
    expect(result.usage).toEqual({
      promptTokens: 40,
      completionTokens: 12,
      reasoningTokens: 8,
      totalTokens: 52,
    });
    expect(body).toMatchObject({
      model: 'test-model',
      reasoning_effort: 'low',
      max_completion_tokens: SMOKE_REQUEST.maxCompletionTokens,
      response_format: { type: 'json_schema', json_schema: { name: 'smoke', strict: true } },
    });
  });

  test('turns a 429 into LlmRateLimitError using retry-after', async () => {
    server.use(
      http.post(COMPLETIONS_URL, () =>
        HttpResponse.json(
          { error: { message: 'rate limited' } },
          { status: 429, headers: { 'retry-after': '7' } },
        ),
      ),
    );

    const error = await client.complete(SMOKE_REQUEST).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmRateLimitError);
    expect((error as LlmRateLimitError).retryAfterMs).toBe(7_000);
  });

  test('rejects an answer cut off by the token limit', async () => {
    server.use(http.post(COMPLETIONS_URL, () => HttpResponse.json(completion('{"sta', 'length'))));

    const error = await client.complete(SMOKE_REQUEST).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmResponseError);
    expect((error as LlmResponseError).finishReason).toBe('length');
    expect((error as LlmResponseError).totalTokens).toBe(52);
  });

  test('rejects an answer that is not valid JSON and keeps its usage', async () => {
    server.use(http.post(COMPLETIONS_URL, () => HttpResponse.json(completion('not json'))));

    const error = await client.complete(SMOKE_REQUEST).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmResponseError);
    expect((error as LlmResponseError).totalTokens).toBe(52);
  });
});
