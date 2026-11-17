import type {
  OAuthCompleteRequest,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthPendingSignup,
  OAuthProvider,
  OAuthProviderList,
} from '@diplomacy/contracts';
import { type Request, type Response, Router } from 'express';
import * as openid from 'openid-client';

import { type OAuthIdentity, suggestUsername } from '../../../auth/oauth-providers.js';
import { establishSession } from '../../../auth/session.js';
import {
  createOAuthCallbackRateLimit,
  oauthCompleteRateLimit,
  oauthLoginRateLimit,
} from '../../../middleware/auth-rate-limits.js';
import { canSignUp } from '../../../services/access.js';
import { db } from '../../../services/db.js';
import { emails } from '../../../services/emails.js';
import { oauth, oauthRedirectUri } from '../../../services/oauth.js';

const PENDING_SIGNUP_TTL_MS = 15 * 60 * 1000;
const DEFAULT_NEXT_PATH = '/lobby';

type OAuthErrorReason =
  'cancelled' | 'failed' | 'email_unverified' | 'linked_elsewhere' | 'rate_limited' | 'invite_only';

const PROVIDER_NOT_CONFIGURED = {
  title: 'Not Found',
  status: 404,
  detail: 'This sign-in provider is not available.',
} as const;

const NO_PENDING_SIGNUP = {
  title: 'Not Found',
  status: 404,
  detail: 'Your sign-in expired. Please start again.',
} as const;

const USERNAME_TAKEN = {
  title: 'Conflict',
  status: 409,
  detail: 'That username is taken.',
} as const;

const EMAIL_TAKEN = {
  title: 'Conflict',
  status: 409,
  detail: 'An account with this email already exists. Sign in instead.',
} as const;

const INVITE_ONLY = {
  title: 'Forbidden',
  status: 403,
  detail: 'Sign-up is invite-only right now.',
} as const;

// Type alias, not interface: Express's ParamsDictionary needs an implicit index signature.
type ProviderParams = { provider: OAuthProvider };

interface CallbackQuery {
  code?: string;
  state?: string;
  error?: string;
}

export const oauthRouter = Router();

// The callback is a browser navigation, so a JSON 429 would strand the user on
// a raw error page; send them back to the login form instead.
const oauthCallbackRateLimit = createOAuthCallbackRateLimit((_req, res) =>
  redirectWithError(res, 'rate_limited'),
);

oauthRouter.get('/providers', (_req: Request, res: Response<OAuthProviderList>) => {
  res.json({ providers: Object.keys(oauth.providers) as OAuthProvider[] });
});

oauthRouter.get('/pending', (req: Request, res: Response) => {
  const pending = activePendingSignup(req);
  if (!pending) {
    return res.status(404).json(NO_PENDING_SIGNUP);
  }
  const body: OAuthPendingSignup = {
    provider: pending.provider,
    email: pending.email,
    suggestedUsername: pending.suggestedUsername,
  };
  return res.json(body);
});

oauthRouter.post(
  '/complete',
  oauthCompleteRateLimit,
  async (req: Request<object, unknown, OAuthCompleteRequest>, res: Response) => {
    const pending = activePendingSignup(req);
    if (!pending) {
      return res.status(404).json(NO_PENDING_SIGNUP);
    }
    // Rechecked here: the pending sign-up outlives a restart, so the allowlist may have changed since the callback.
    if (!canSignUp(pending.email)) {
      delete req.session.oauthPending;
      return res.status(403).json(INVITE_ONLY);
    }

    const identity = { provider: pending.provider, subject: pending.subject };
    const username = req.body.username.trim();

    if (await db.users.findByUsername(username)) {
      return res.status(409).json(USERNAME_TAKEN);
    }

    const created = await db.users.createOAuthUser({ email: pending.email, username, identity });
    if (created) {
      await establishSession(req, created);
      return res.status(200).json(created);
    }

    // Lost a race: same identity finished in another tab, or the email or
    // username was claimed since the callback.
    const sameIdentity = await db.users.findByOAuth(identity);
    if (sameIdentity) {
      const publicUser = toPublicUser(sameIdentity);
      await establishSession(req, publicUser);
      return res.status(200).json(publicUser);
    }
    if (await db.users.findByEmail(pending.email)) {
      return res.status(409).json(EMAIL_TAKEN);
    }
    return res.status(409).json(USERNAME_TAKEN);
  },
);

oauthRouter.post(
  '/:provider/login',
  oauthLoginRateLimit,
  async (req: Request<ProviderParams, unknown, OAuthLoginRequest | undefined>, res: Response) => {
    const { provider } = req.params;
    const client = oauth.providers[provider];
    if (!client) {
      return res.status(404).json(PROVIDER_NOT_CONFIGURED);
    }

    const codeVerifier = openid.randomPKCECodeVerifier();
    const state = openid.randomState();
    const nonce = openid.randomNonce();
    const url = await client.authorizationUrl({
      redirectUri: oauthRedirectUri(provider),
      state,
      nonce,
      codeChallenge: await openid.calculatePKCECodeChallenge(codeVerifier),
    });

    req.session.oauthFlow = {
      provider,
      state,
      nonce,
      codeVerifier,
      next: safeNextPath(req.body?.next),
    };
    const body: OAuthLoginResponse = { url: url.href };
    return res.json(body);
  },
);

oauthRouter.get(
  '/:provider/callback',
  oauthCallbackRateLimit,
  async (req: Request<ProviderParams, unknown, unknown, CallbackQuery>, res: Response) => {
    const { provider } = req.params;
    const flow = req.session.oauthFlow;
    delete req.session.oauthFlow;

    const client = oauth.providers[provider];
    if (!client || !flow || flow.provider !== provider) {
      return redirectWithError(res, 'failed');
    }
    if (req.query.error) {
      return redirectWithError(res, req.query.error === 'access_denied' ? 'cancelled' : 'failed');
    }

    let identity: OAuthIdentity;
    try {
      const callbackUrl = new URL(oauthRedirectUri(provider));
      callbackUrl.search = new URL(req.originalUrl, 'http://callback.invalid').search;
      identity = await client.exchangeCode(callbackUrl, flow);
    } catch (err) {
      req.log.warn({ err, provider }, 'oauth code exchange failed');
      return redirectWithError(res, 'failed');
    }

    const linked = await db.users.findByOAuth(identity);
    if (linked) {
      await establishSession(req, toPublicUser(linked));
      return redirectToApp(res, flow.next);
    }

    // Without a provider-verified email we can neither link nor create: the
    // address could belong to someone else (nOAuth-style takeover).
    if (!identity.emailVerified) {
      return redirectWithError(res, 'email_unverified');
    }

    const existing = await db.users.findByEmail(identity.email);
    if (existing) {
      const didLink =
        !existing.oauthProvider &&
        (await db.users.linkOAuth(existing.id, {
          identity,
          clearPassword: !existing.emailVerifiedAt,
        }));
      if (!didLink) {
        return redirectWithError(res, 'linked_elsewhere');
      }
      req.log.info({ user_id: existing.id, provider }, 'linked oauth identity by verified email');
      // An unverified account had no proven owner to notify; the person signing in is its owner now.
      if (existing.emailVerifiedAt) {
        void emails.auth
          .signInLinked(existing.email, { username: existing.username, provider })
          .catch((err: unknown) => req.log.error({ err }, 'failed to send sign-in linked notice'));
      }
      await establishSession(req, toPublicUser(existing));
      return redirectToApp(res, flow.next);
    }

    if (!canSignUp(identity.email)) {
      return redirectWithError(res, 'invite_only');
    }

    await regenerateSession(req);
    req.session.oauthPending = {
      provider,
      subject: identity.subject,
      email: identity.email,
      suggestedUsername: suggestUsername(identity),
      next: flow.next,
      expiresAt: Date.now() + PENDING_SIGNUP_TTL_MS,
    };
    return redirectToApp(res, '/auth/oauth/complete', { next: flow.next });
  },
);

function activePendingSignup(req: Pick<Request, 'session'>) {
  const pending = req.session.oauthPending;
  if (!pending || pending.expiresAt < Date.now()) {
    return null;
  }
  return pending;
}

function toPublicUser(user: { id: string; email: string; username: string }) {
  return { id: user.id, email: user.email, username: user.username };
}

/**
 * Path-only, like the frontend's `useNextPath`. Resolved against the app origin
 * rather than string-checked: the URL parser strips tabs and newlines and reads
 * backslashes as slashes, so prefix checks alone can be bypassed.
 */
function safeNextPath(next: string | undefined): string {
  if (!next?.startsWith('/')) {
    return DEFAULT_NEXT_PATH;
  }
  const appOrigin = new URL(oauth.appUrl).origin;
  const resolved = new URL(next, appOrigin);
  if (resolved.origin !== appOrigin) {
    return DEFAULT_NEXT_PATH;
  }
  // Dot segments can normalize to a protocol-relative `//host` path, so the
  // returned string must pass the same check when redirectToApp reparses it.
  const path = resolved.pathname + resolved.search + resolved.hash;
  if (new URL(path, appOrigin).origin !== appOrigin) {
    return DEFAULT_NEXT_PATH;
  }
  return path;
}

function redirectToApp(res: Response, path: string, params?: Record<string, string>): void {
  const url = new URL(path, oauth.appUrl);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  res.redirect(302, url.href);
}

function redirectWithError(res: Response, reason: OAuthErrorReason): void {
  redirectToApp(res, '/auth/login', { oauthError: reason });
}

function regenerateSession(req: Pick<Request, 'session'>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}
