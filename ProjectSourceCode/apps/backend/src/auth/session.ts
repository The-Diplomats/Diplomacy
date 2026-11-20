import { type Request } from 'express';

import { type PublicUser } from '../repositories/users.js';
import { disconnectSession } from '../services/realtime.js';

/** Name of the session cookie (express-session default). */
export const SESSION_COOKIE_NAME = 'connect.sid';

/**
 * Signs `user` in on this request. Issues a fresh session ID first to prevent
 * session fixation, then persists before the response is sent.
 */
export async function establishSession(
  req: Pick<Request, 'session'>,
  user: PublicUser,
): Promise<void> {
  const previousSessionId = req.session.id;
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  disconnectSession(previousSessionId);
  req.session.user = { id: user.id, email: user.email, username: user.username };
  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

/** Destroys the session server-side and disconnects connected sockets */
export async function destroySession(req: Pick<Request, 'session'>): Promise<void> {
  const sessionId = req.session.id;
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  disconnectSession(sessionId);
}
