export class LlmRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`LLM rate limited, retry after ${retryAfterMs} ms`);
    this.name = 'LlmRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class LlmResponseError extends Error {
  readonly finishReason: string | undefined;
  /** Tokens the provider still billed for the unusable answer. */
  readonly totalTokens: number;

  constructor(message: string, finishReason: string | undefined, totalTokens: number) {
    super(message);
    this.name = 'LlmResponseError';
    this.finishReason = finishReason;
    this.totalTokens = totalTokens;
  }
}
