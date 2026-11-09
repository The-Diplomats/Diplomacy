import { type Request, type Response, Router } from 'express';

import { hashPassword } from '../../../auth/password.js';
import { establishSession } from '../../../auth/session.js';
import { generateVerificationCode, hashVerificationCode } from '../../../auth/verification-code.js';
import { logger } from '../../../log.js';
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
  username: string;
  password: string;
}

interface VerifyBody {
  identifier: string;
  code: string;
}

interface ResendBody {
  identifier: string;
}

export const registerRouter = Router();

registerRouter.post('/', async (req: Request<object, unknown, BeginBody>, res: Response) => {
  const email = req.body.email.trim().toLowerCase();
  const username = req.body.username.trim();
  const password = req.body.password;

  const existingByUsername = await db.users.findByUsername(username);
  const existingByEmail = await db.users.findByEmail(email);

  if (existingByUsername && existingByUsername.email !== email) {
    if (existingByUsername.emailVerifiedAt) {
      void emails.auth
        .securityNotice(existingByUsername.email, { username: existingByUsername.username })
        .catch((err) => logger.error({ err }, 'failed to send security notice'));
    }
    return res.status(202).end();
  }

  if (existingByEmail) {
    if (existingByEmail.emailVerifiedAt) {
      void emails.auth
        .securityNotice(existingByEmail.email, { username: existingByEmail.username })
        .catch((err) => logger.error({ err }, 'failed to send security notice'));
      return res.status(202).end();
    }
    await issueVerificationEmail(
      existingByEmail.id,
      existingByEmail.email,
      existingByEmail.username,
    );
    return res.status(202).end();
  }

  const passwordHash = await hashPassword(password);
  const created = await db.users.create({ email, username, passwordHash });
  if (!created) {
    return res.status(202).end();
  }
  await issueVerificationEmail(created.id, created.email, created.username);
  return res.status(202).end();
});

registerRouter.post('/verify', async (req: Request<object, unknown, VerifyBody>, res: Response) => {
  const identifier = req.body.identifier.trim();
  const code = req.body.code;

  const user = await db.users.findByIdentifier(identifier);
  if (!user || user.emailVerifiedAt) {
    return res.status(400).json(INVALID_OR_EXPIRED);
  }

  const token = await db.verificationTokens.findActive(user.id, 'email_verify');
  if (!token || token.tokenHash !== hashVerificationCode(code)) {
    return res.status(400).json(INVALID_OR_EXPIRED);
  }

  await db.verificationTokens.markUsed(token.id);
  await db.users.markEmailVerified(user.id);

  const publicUser = { id: user.id, email: user.email, username: user.username };
  await establishSession(req, publicUser);
  return res.status(200).json(publicUser);
});

registerRouter.post('/resend', async (req: Request<object, unknown, ResendBody>, res: Response) => {
  const identifier = req.body.identifier.trim();
  const user = await db.users.findByIdentifier(identifier);

  if (user && !user.emailVerifiedAt) {
    await issueVerificationEmail(user.id, user.email, user.username);
  }

  return res.status(202).end();
});

async function issueVerificationEmail(
  userId: string,
  email: string,
  username: string,
): Promise<void> {
  await db.verificationTokens.invalidateOutstanding(userId, 'email_verify');
  const code = generateVerificationCode();
  const token = await db.verificationTokens.create({
    userId,
    purpose: 'email_verify',
    tokenHash: hashVerificationCode(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  await emails.auth.verifyRegister(email, { username, code, tokenId: token.id });
}
