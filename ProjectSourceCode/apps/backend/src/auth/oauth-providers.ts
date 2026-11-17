import type { OAuthProvider } from '@diplomacy/contracts';
import * as openid from 'openid-client';

export interface OAuthIdentity {
  provider: OAuthProvider;
  /** Stable per-user identifier; see `toIdentity` per provider for the convention. */
  subject: string;
  /** Lowercased. */
  email: string;
  /** True only when the provider vouches that the user controls `email`. */
  emailVerified: boolean;
  displayName: string | null;
}

export interface AuthorizationRequest {
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}

export interface CallbackChecks {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface OAuthProviderClient {
  authorizationUrl(request: AuthorizationRequest): Promise<URL>;
  /** `callbackUrl` is the registered redirect URI plus the provider's query string. */
  exchangeCode(callbackUrl: URL, checks: CallbackChecks): Promise<OAuthIdentity>;
}

export interface OAuthClientCredentials {
  clientId: string;
  clientSecret: string;
}

type IdTokenClaims = openid.IDToken;

interface ProviderDefinition {
  issuer: URL;
  scope: string;
  toIdentity(claims: IdTokenClaims): OAuthIdentity | null;
}

const providerDefinitions: Record<OAuthProvider, ProviderDefinition> = {
  google: {
    issuer: new URL('https://accounts.google.com'),
    scope: 'openid email profile',
    // Google's `sub` is stable and the same across apps.
    toIdentity: (claims) => {
      if (typeof claims.email !== 'string') {
        return null;
      }
      return {
        provider: 'google',
        subject: claims.sub,
        email: claims.email.toLowerCase(),
        emailVerified: claims.email_verified === true,
        displayName: stringClaim(claims.name),
      };
    },
  },
  microsoft: {
    // Multi-tenant: work/school and personal accounts. openid-client resolves
    // the `{tenantid}` issuer template against each token's `tid` claim.
    issuer: new URL('https://login.microsoftonline.com/common/v2.0'),
    scope: 'openid email profile',
    // `sub` is pairwise per app, so key on tenant + object ID instead (DESIGN_DOC §7).
    // The `email` claim is admin-editable in a tenant; only `xms_edov` (an
    // optional claim set on the app registration) says the domain owner is verified.
    toIdentity: (claims) => {
      const tenantId = stringClaim(claims.tid);
      const objectId = stringClaim(claims.oid);
      if (!tenantId || !objectId || typeof claims.email !== 'string') {
        return null;
      }
      return {
        provider: 'microsoft',
        subject: `${tenantId}:${objectId}`,
        email: claims.email.toLowerCase(),
        emailVerified: isTrueClaim(claims.xms_edov),
        displayName: stringClaim(claims.name),
      };
    },
  },
};

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Microsoft sends boolean optional claims like `xms_edov` as `'1'` in practice, not `true`. */
export function isTrueClaim(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

/** Maps verified ID token claims to an identity, or null when required claims are missing. */
export function identityFromClaims(
  provider: OAuthProvider,
  claims: IdTokenClaims,
): OAuthIdentity | null {
  return providerDefinitions[provider].toIdentity(claims);
}

export class OAuthClaimsError extends Error {
  constructor(provider: OAuthProvider) {
    super(`${provider} ID token is missing required claims`);
    this.name = 'OAuthClaimsError';
  }
}

export function createOpenIdProviderClient(
  provider: OAuthProvider,
  credentials: OAuthClientCredentials,
): OAuthProviderClient {
  const definition = providerDefinitions[provider];
  let configuration: Promise<openid.Configuration> | undefined;

  // Discovery is lazy so boot doesn't depend on the provider being reachable,
  // and a failed fetch is retried on the next request instead of cached.
  const getConfiguration = (): Promise<openid.Configuration> => {
    configuration ??= openid
      .discovery(definition.issuer, credentials.clientId, credentials.clientSecret)
      .catch((err: unknown) => {
        configuration = undefined;
        throw err;
      });
    return configuration;
  };

  return {
    async authorizationUrl({ redirectUri, state, nonce, codeChallenge }) {
      return openid.buildAuthorizationUrl(await getConfiguration(), {
        redirect_uri: redirectUri,
        scope: definition.scope,
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      });
    },

    async exchangeCode(callbackUrl, { state, nonce, codeVerifier }) {
      const tokens = await openid.authorizationCodeGrant(await getConfiguration(), callbackUrl, {
        expectedState: state,
        expectedNonce: nonce,
        pkceCodeVerifier: codeVerifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      const identity = claims ? identityFromClaims(provider, claims) : null;
      if (!identity) {
        throw new OAuthClaimsError(provider);
      }
      return identity;
    },
  };
}

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;

/** Prefill for the username picker; the user can change it, and uniqueness is checked on submit. */
export function suggestUsername(identity: Pick<OAuthIdentity, 'email' | 'displayName'>): string {
  const candidates = [identity.displayName, identity.email.split('@')[0]];
  for (const candidate of candidates) {
    const cleaned = (candidate ?? '')
      .normalize('NFKD')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, USERNAME_MAX_LENGTH);
    if (cleaned.length >= USERNAME_MIN_LENGTH) {
      return cleaned;
    }
  }
  return '';
}
