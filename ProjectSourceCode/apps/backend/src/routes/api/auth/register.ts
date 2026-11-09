import { type Request, type Response, Router } from 'express';

import { hashPassword } from '../../../auth/password.js';
import { establishSession } from '../../../auth/session.js';
import { type UserRepository } from '../../../repositories/users.js';

// Request shape (email format, password minLength 8, no extra fields) is
// enforced by the OpenAPI validator before this handler runs.
interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

export function createRegisterRouter(users: UserRepository): Router {
  const router = Router();

  router.post('/register', async (req: Request<object, unknown, RegisterBody>, res: Response) => {
    const email = req.body.email.trim().toLowerCase();
    const username = req.body.username.trim();
    const passwordHash = await hashPassword(req.body.password);

    const user = await users.create({ email, username, passwordHash });
    if (!user) {
      return res.status(409).json({
        title: 'Conflict',
        status: 409,
        detail: 'An account with this email or username already exists.',
      });
    }

    await establishSession(req, user);
    return res.status(201).json(user);
  });

  return router;
}
