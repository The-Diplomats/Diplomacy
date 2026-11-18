# @diplomacy/ai

LLM client for AI turns: strict structured output against any OpenAI-compatible host, plus a fixture-backed mock. No
database or Redis.

```ts
import { createLlmClient, readLlmConfig } from '@diplomacy/ai';

const llm = createLlmClient(readLlmConfig()!); // readLlmConfig() is null without LLM_API_KEY
const { data, usage } = await llm.complete<Result>({ name, schema, messages, maxCompletionTokens });
```

Config: `LLM_API_KEY`, `LLM_BASE_URL` (default `https://api.groq.com/openai/v1`), `LLM_MODEL` (default
`openai/gpt-oss-20b`). The client never retries; a 429 throws `LlmRateLimitError` with `retryAfterMs`.

Mock: `createMockLlmServer(baseUrl)` from `@diplomacy/ai/mock` answers with `fixtures/llm/<schema name>.json`.

Tests: `pnpm --filter @diplomacy/ai run test` (Vitest).
