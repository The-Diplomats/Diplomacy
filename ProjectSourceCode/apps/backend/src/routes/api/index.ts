import { type RequestHandler, Router } from 'express';

import { surfaceOnly } from '../../middleware/surface-only.js';
import { type UserRepository } from '../../repositories/users.js';
import { createAuthRouter } from './auth/index.js';
import { healthRouter } from './health.js';

export interface ApiDeps {
  users: UserRepository;
}

export function createApiSurface(validator: RequestHandler[], deps: ApiDeps): Router {
  const api = Router();
  api.use(surfaceOnly('api'));
  api.use(...validator);
  api.use('/', healthRouter);
  api.use('/auth', createAuthRouter(deps.users));
  return api;
}
