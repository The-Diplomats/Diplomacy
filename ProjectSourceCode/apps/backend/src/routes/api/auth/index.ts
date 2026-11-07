import { Router } from 'express';

import { type UserRepository } from '../../../repositories/users.js';
import { createLoginRouter } from './login.js';
import { logoutRouter } from './logout.js';
import { meRouter } from './me.js';
import { createRegisterRouter } from './register.js';

export function createAuthRouter(users: UserRepository): Router {
  const auth = Router();
  auth.use(meRouter);
  auth.use(createLoginRouter(users));
  auth.use(createRegisterRouter(users));
  auth.use(logoutRouter);
  return auth;
}
