import { type Request, type Response, Router } from 'express';

import { destroySession, SESSION_COOKIE_NAME } from '../../../auth/session.js';

export const logoutRouter = Router();

// Idempotent: succeeds whether or not a session exists.
logoutRouter.post('/logout', async (req: Request, res: Response) => {
  if (req.session.user) {
    await destroySession(req);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.status(204).end();
});
