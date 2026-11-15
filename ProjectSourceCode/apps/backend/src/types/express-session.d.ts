import 'express-session';

import type { OAuthProvider } from '@diplomacy/contracts';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      username: string;
    };
    /** Between `/auth/oauth/:provider/login` and its callback. */
    oauthFlow?: {
      provider: OAuthProvider;
      state: string;
      nonce: string;
      codeVerifier: string;
      next: string;
    };
    /** Verified provider identity with no account yet; consumed by `/auth/oauth/complete`. */
    oauthPending?: {
      provider: OAuthProvider;
      subject: string;
      email: string;
      suggestedUsername: string;
      next: string;
      expiresAt: number;
    };
  }
}
