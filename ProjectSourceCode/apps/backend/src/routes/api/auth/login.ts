import { type Request, type Response, Router } from 'express';

import { hashPassword, verifyPassword } from '../../../auth/password.js';
import { establishSession } from '../../../auth/session.js';
import { createLoginRateLimit } from '../../../middleware/login-rate-limit.js';
import { db } from '../../../services/db.js';

interface LoginBody {
  identifier: string;
  password: string;
}

const INVALID_CREDENTIALS = {
  title: 'Unauthorized',
  status: 401,
  detail: 'Invalid credentials.',
} as const;

const NOT_VERIFIED = {
  title: 'Forbidden',
  status: 403,
  detail: 'Please verify your email before signing in.',
} as const;

// Verified against when no usable account exists, so unknown identifiers take
// roughly as long as wrong passwords (avoids account enumeration by timing).
const dummyHash = hashPassword('timing-equalization-placeholder');

export const loginRouter = Router();

loginRouter.post(
  '/login',
  ...createLoginRateLimit(),
  async (req: Request<object, unknown, LoginBody>, res: Response) => {
    const identifier = req.body.identifier.trim();
    const user = await db.users.findByIdentifier(identifier);

    // OAuth-only accounts have no password hash and can't log in this way.
    const valid = await verifyPassword(req.body.password, user?.passwordHash ?? (await dummyHash));
    if (!user?.passwordHash || !valid) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    if (!user.emailVerifiedAt) {
      return res.status(403).json(NOT_VERIFIED);
    }

    const publicUser = { id: user.id, email: user.email, username: user.username };
    await establishSession(req, publicUser);
    return res.status(200).json(publicUser);
  },
);
