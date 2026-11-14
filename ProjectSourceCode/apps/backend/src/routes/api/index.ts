import { type RequestHandler, Router } from 'express';

import { surfaceOnly } from '../../middleware/surface-only.js';
import { authRouter } from './auth/index.js';
import { messagesRouter } from './games/messages.js';
import { healthRouter } from './health.js';

export function createApiSurface(validator: RequestHandler[]): Router {
  const api = Router();
  api.use(surfaceOnly('api'));
  api.use(...validator);
  api.use('/', healthRouter);
  api.use('/auth', authRouter);
  api.use('/games', messagesRouter);
  return api;
}
