import type { RequestHandler } from 'msw';

import { healthHandler } from './health';

export function getDefaultHandlers(): RequestHandler[] {
  return [healthHandler];
}
