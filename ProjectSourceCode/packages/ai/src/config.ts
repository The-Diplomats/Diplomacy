export const DEFAULT_LLM_BASE_URL = 'https://api.groq.com/openai/v1';
export const DEFAULT_LLM_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_LLM_TIMEOUT_MS = 30_000;

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/** Returns null when `LLM_API_KEY` is unset, so callers can run without a real LLM. */
export function readLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const apiKey = env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    baseUrl: env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL,
    model: env.LLM_MODEL?.trim() || DEFAULT_LLM_MODEL,
    timeoutMs: DEFAULT_LLM_TIMEOUT_MS,
  };
}
