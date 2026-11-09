import { type Request, type Response, Router } from 'express';

import { hashPassword } from '../../../auth/password.js';
import { establishSession } from '../../../auth/session.js';
import { generateVerificationCode, hashVerificationCode } from '../../../auth/verification-code.js';
import {
  passwordResetRateLimit,
  passwordResetVerifyRateLimit,
} from '../../../middleware/auth-rate-limits.js';
import { db } from '../../../services/db.js';
import { emails } from '../../../services/emails.js';

const CODE_TTL_MS = 15 * 60 * 1000;

const INVALID_OR_EXPIRED = {
  title: 'Bad Request',
  status: 400,
  detail: 'Invalid or expired code.',
} as const;

interface BeginBody {
  email: string;
}

interface VerifyBody {
  email: string;
  code: string;
  newPassword: string;
}

export const passwordResetRouter = Router();

passwordResetRouter.post(
  '/',
  passwordResetRateLimit,
  async (req: Request<object, unknown, BeginBody>, res: Response) => {
    const email = req.body.email.trim().toLowerCase();
    const user = await db.users.findByEmail(email);

    if (user && user.emailVerifiedAt && user.passwordHash) {
      await db.verificationTokens.invalidateOutstanding(user.id, 'password_reset');
      const code = generateVerificationCode();
      const token = await db.verificationTokens.create({
        userId: user.id,
        purpose: 'password_reset',
        tokenHash: hashVerificationCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });
      await emails.auth.passwordReset(user.email, {
        username: user.username,
        code,
        tokenId: token.id,
      });
    }

    return res.status(202).end();
  },
);

passwordResetRouter.post(
  '/verify',
  passwordResetVerifyRateLimit,
  async (req: Request<object, unknown, VerifyBody>, res: Response) => {
    const email = req.body.email.trim().toLowerCase();
    const code = req.body.code;
    const newPassword = req.body.newPassword;

    const user = await db.users.findByEmail(email);
    if (!user || !user.emailVerifiedAt) {
      return res.status(400).json(INVALID_OR_EXPIRED);
    }

    const token = await db.verificationTokens.findActive(user.id, 'password_reset');
    if (!token || token.tokenHash !== hashVerificationCode(code)) {
      return res.status(400).json(INVALID_OR_EXPIRED);
    }

    const newHash = await hashPassword(newPassword);
    await db.verificationTokens.markUsed(token.id);
    await db.users.updatePasswordHash(user.id, newHash);

    const publicUser = { id: user.id, email: user.email, username: user.username };
    await establishSession(req, publicUser);
    return res.status(200).json(publicUser);
  },
);
