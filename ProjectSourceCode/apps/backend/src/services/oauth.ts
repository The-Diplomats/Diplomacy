import type { OAuthProvider } from '@diplomacy/contracts';

import {
  createOpenIdProviderClient,
  type OAuthClientCredentials,
  type OAuthProviderClient,
} from '../auth/oauth-providers.js';

export interface OAuth {
  providers: Partial<Record<OAuthProvider, OAuthProviderClient>>;
  /** Public base URL of the API surface; callbacks live at `<base>/auth/oauth/<provider>/callback`. */
  apiPublicUrl: string;
  /** Frontend origin the callback redirects back to. */
  appUrl: string;
}

export let oauth: OAuth = { providers: {}, apiPublicUrl: '', appUrl: '' };

/** Escape hatch for tests: swap in fake provider clients. */
export function setOAuth(instance: OAuth): void {
  oauth = instance;
}

export interface OAuthConfig {
  providers: Partial<Record<OAuthProvider, OAuthClientCredentials>>;
  apiPublicUrl: string;
  appUrl: string;
}

export function initOAuth(config: OAuthConfig): void {
  const providers: OAuth['providers'] = {};
  for (const [provider, credentials] of Object.entries(config.providers) as [
    OAuthProvider,
    OAuthClientCredentials,
  ][]) {
    providers[provider] = createOpenIdProviderClient(provider, credentials);
  }
  oauth = { providers, apiPublicUrl: config.apiPublicUrl, appUrl: config.appUrl };
}

export function oauthRedirectUri(provider: OAuthProvider): string {
  return `${oauth.apiPublicUrl.replace(/\/+$/, '')}/auth/oauth/${provider}/callback`;
}
