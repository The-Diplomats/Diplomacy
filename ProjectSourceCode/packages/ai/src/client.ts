import OpenAI, { RateLimitError } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import type { LlmConfig } from './config.js';
import { LlmRateLimitError, LlmResponseError } from './errors.js';

// Used when a 429 arrives without a usable `retry-after`; limits are per-minute windows.
const FALLBACK_RETRY_AFTER_MS = 60_000;

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}

export interface StructuredRequest {
  /** Schema name sent to the API; mock mode also uses it to pick a fixture. */
  name: string;
  /** JSON Schema for strict mode: every property required, `additionalProperties: false`. */
  schema: Record<string, unknown>;
  messages: ChatCompletionMessageParam[];
  maxCompletionTokens: number;
}

export interface StructuredResult<T> {
  data: T;
  usage: LlmUsage;
}

export interface LlmClient {
  readonly model: string;
  complete<T>(request: StructuredRequest): Promise<StructuredResult<T>>;
}

export function createLlmClient(config: LlmConfig): LlmClient {
  // Retries are left to BullMQ so a rate-limited turn waits in the queue, not in memory.
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    maxRetries: 0,
  });

  return {
    model: config.model,
    async complete<T>(request: StructuredRequest): Promise<StructuredResult<T>> {
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: config.model,
          messages: request.messages,
          max_completion_tokens: request.maxCompletionTokens,
          reasoning_effort: 'low',
          response_format: {
            type: 'json_schema',
            json_schema: { name: request.name, schema: request.schema, strict: true },
          },
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new LlmRateLimitError(retryAfterMs(error.headers));
        }
        throw error;
      }

      const usage: LlmUsage = {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        reasoningTokens: completion.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      };

      const choice = completion.choices[0];
      const content = choice?.message.content;
      if (choice?.finish_reason !== 'stop' || !content) {
        throw new LlmResponseError(
          'LLM returned no complete answer',
          choice?.finish_reason,
          usage.totalTokens,
        );
      }

      let data: T;
      try {
        data = JSON.parse(content) as T;
      } catch {
        throw new LlmResponseError(
          'LLM returned invalid JSON',
          choice.finish_reason,
          usage.totalTokens,
        );
      }
      return { data, usage };
    },
  };
}

function retryAfterMs(headers: Headers | undefined): number {
  const value = headers?.get('retry-after');
  if (!value) {
    return FALLBACK_RETRY_AFTER_MS;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? FALLBACK_RETRY_AFTER_MS : Math.max(0, date - Date.now());
}
