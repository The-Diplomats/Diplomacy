import type { RequestHandler } from 'msw';

import { authHandlers } from './auth';
import { healthHandler } from './health';

export function getDefaultHandlers(): RequestHandler[] {
  return [healthHandler, ...authHandlers];
}
