import { type RequestHandler } from 'express';
import { ipKeyGenerator, MemoryStore, rateLimit } from 'express-rate-limit';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Tracked so tests can clear counters between runs; see `resetAuthRateLimits`.
const stores: MemoryStore[] = [];

function createIpRateLimit(options: {
  windowMs: number;
  limit: number;
  detail: string;
}): RequestHandler {
  const store = new MemoryStore();
  stores.push(store);
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
    handler: (_req, res) => {
      res.status(429).json({
        title: 'Too Many Requests',
        status: 429,
        detail: options.detail,
      });
    },
  });
}

/** Test seam: clears all in-process auth rate limit counters. */
export function resetAuthRateLimits(): void {
  for (const store of stores) {
    store.resetAll?.();
  }
}

export const registerRateLimit = createIpRateLimit({
  windowMs: HOUR,
  limit: 5,
  detail: 'Too many registration attempts from this address. Try again later.',
});

export const registerVerifyRateLimit = createIpRateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  detail: 'Too many verification attempts. Try again later.',
});

export const registerResendRateLimit = createIpRateLimit({
  windowMs: MINUTE,
  limit: 3,
  detail: 'Please wait a moment before requesting another code.',
});

export const passwordResetRateLimit = createIpRateLimit({
  windowMs: HOUR,
  limit: 3,
  detail: 'Too many password reset requests from this address. Try again later.',
});

export const passwordResetVerifyRateLimit = createIpRateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  detail: 'Too many reset attempts. Try again later.',
});
