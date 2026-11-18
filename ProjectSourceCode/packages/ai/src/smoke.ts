import type { StructuredRequest } from './client.js';

export interface SmokeResult {
  status: 'ok';
}

/** A minimal structured call for checking a host, key and model end to end. */
export const SMOKE_REQUEST: StructuredRequest = {
  name: 'smoke',
  schema: {
    type: 'object',
    properties: { status: { type: 'string', enum: ['ok'] } },
    required: ['status'],
    additionalProperties: false,
  },
  messages: [
    { role: 'system', content: 'You are a health check. Answer with the requested JSON only.' },
    { role: 'user', content: 'Report status ok.' },
  ],
  maxCompletionTokens: 256,
};
