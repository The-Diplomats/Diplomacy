import { readFile } from 'node:fs/promises';

import { http, HttpResponse } from 'msw';
import { type SetupServer, setupServer } from 'msw/node';

import { DEFAULT_LLM_BASE_URL } from './config.js';

const FIXTURES_DIR = new URL('../fixtures/llm/', import.meta.url);
const FIXTURE_NAME = /^[a-z0-9_-]+$/i;

interface CompletionRequestBody {
  model?: string;
  response_format?: { json_schema?: { name?: string } };
}

/**
 * Intercepts chat completions at the HTTP layer, so the real client code runs. The response is
 * `fixtures/llm/<schema name>.json`. Call `listen()` before creating the client: the SDK captures
 * `fetch` at construction.
 */
export function createMockLlmServer(baseUrl: string = DEFAULT_LLM_BASE_URL): SetupServer {
  return setupServer(
    http.post(`${baseUrl}/chat/completions`, async ({ request }) => {
      const body = (await request.json()) as CompletionRequestBody;
      const name = body.response_format?.json_schema?.name ?? '';
      if (!FIXTURE_NAME.test(name)) {
        return HttpResponse.json(
          { error: { message: `invalid schema name "${name}"` } },
          { status: 400 },
        );
      }

      let content: string;
      try {
        content = await readFile(new URL(`${name}.json`, FIXTURES_DIR), 'utf8');
      } catch {
        return HttpResponse.json(
          { error: { message: `no fixture for schema "${name}"` } },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        id: `mock-${name}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model ?? 'mock',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: { role: 'assistant', content: JSON.stringify(JSON.parse(content)) },
          },
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });
    }),
  );
}
