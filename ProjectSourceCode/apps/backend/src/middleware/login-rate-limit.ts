import { type Request, type RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

export interface LoginRateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Failed attempts allowed per IP + email within the window. */
  maxFailuresPerAccount: number;
  /** Attempts (any outcome) allowed per IP within the window. */
  maxPerIp: number;
}

export const DEFAULT_LOGIN_RATE_LIMIT: LoginRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  maxFailuresPerAccount: 5,
  maxPerIp: 50,
};

const TOO_MANY_ATTEMPTS = {
  title: 'Too Many Requests',
  status: 429,
  detail: 'Too many login attempts. Please try again later.',
} as const;

// Uses an in-process memory store, so counts are per backend instance and
// reset on restart. Move to a shared (Redis) store if we run multiple replicas.
export function createLoginRateLimit(
  options: LoginRateLimitOptions = DEFAULT_LOGIN_RATE_LIMIT,
): RequestHandler[] {
  const shared = {
    windowMs: options.windowMs,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req: Request, res: Parameters<RequestHandler>[1]) => {
      res.status(429).json(TOO_MANY_ATTEMPTS);
    },
  } as const;

  // Broad cap per client IP: stops one client spraying many accounts.
  const perIp = rateLimit({
    ...shared,
    limit: options.maxPerIp,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  });

  // Tight cap on failures per IP + account: stops password guessing against
  // one account, while successful logins don't count against the user.
  const perAccount = rateLimit({
    ...shared,
    limit: options.maxFailuresPerAccount,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const identifier = String(
        (req.body as { identifier?: unknown } | undefined)?.identifier ?? '',
      )
        .trim()
        .toLowerCase();
      return `${ipKeyGenerator(req.ip ?? '')}:${identifier}`;
    },
  });

  return [perIp, perAccount];
}
