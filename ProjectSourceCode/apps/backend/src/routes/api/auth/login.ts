import { type Request, type Response, Router } from 'express';

import { hashPassword, verifyPassword } from '../../../auth/password.js';
import { establishSession } from '../../../auth/session.js';
import {
  createLoginRateLimit,
  type LoginRateLimitOptions,
} from '../../../middleware/login-rate-limit.js';
import { type UserRepository } from '../../../repositories/users.js';

// Request shape (email format, no extra fields) is enforced by the OpenAPI
// validator before this handler runs.
interface LoginBody {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS = {
  title: 'Unauthorized',
  status: 401,
  detail: 'Invalid email or password.',
} as const;

// Verified against when no usable account exists, so unknown emails take
// roughly as long as wrong passwords (avoids account enumeration by timing).
const dummyHash = hashPassword('timing-equalization-placeholder');

export function createLoginRouter(
  users: UserRepository,
  rateLimitOptions?: LoginRateLimitOptions,
): Router {
  const router = Router();

  router.post(
    '/login',
    ...createLoginRateLimit(rateLimitOptions),
    async (req: Request<object, unknown, LoginBody>, res: Response) => {
      const email = req.body.email.trim().toLowerCase();
      const user = await users.findByEmail(email);

      // OAuth-only accounts have no password hash and can't log in this way.
      const valid = await verifyPassword(
        req.body.password,
        user?.passwordHash ?? (await dummyHash),
      );
      if (!user?.passwordHash || !valid) {
        return res.status(401).json(INVALID_CREDENTIALS);
      }

      const publicUser = { id: user.id, email: user.email, username: user.username };
      await establishSession(req, publicUser);
      return res.status(200).json(publicUser);
    },
  );

  return router;
}
