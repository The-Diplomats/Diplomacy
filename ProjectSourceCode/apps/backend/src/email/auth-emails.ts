import type { OAuthProvider } from '@diplomacy/contracts';

import type { EmailSender } from './sender.js';
import { passwordResetTemplate } from './templates/password-reset.js';
import { securityNoticeTemplate } from './templates/security-notice.js';
import { signInLinkedTemplate } from './templates/sign-in-linked.js';
import { verifyRegisterTemplate } from './templates/verify-register.js';

export interface AuthEmailsConfig {
  /** Base URL of the frontend app, used to build email links. */
  appUrl: string;
  /** Minutes until the verification/reset code expires. */
  codeExpiresInMinutes: number;
}

export interface AuthEmails {
  verifyRegister(to: string, params: { username: string; code: string }): Promise<void>;
  passwordReset(to: string, params: { username: string; code: string }): Promise<void>;
  securityNotice(to: string, params: { username: string }): Promise<void>;
  signInLinked(to: string, params: { username: string; provider: OAuthProvider }): Promise<void>;
}

const PROVIDER_NAMES: Record<OAuthProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
};

export function createAuthEmails(sender: EmailSender, config: AuthEmailsConfig): AuthEmails {
  const { appUrl, codeExpiresInMinutes } = config;

  return {
    async verifyRegister(to, { username, code }) {
      const params = new URLSearchParams({ code, identifier: to });
      const verifyUrl = `${appUrl}/auth/register/verify?${params.toString()}`;
      await sender.send({
        to,
        ...verifyRegisterTemplate({
          username,
          code,
          verifyUrl,
          expiresInMinutes: codeExpiresInMinutes,
          appUrl,
        }),
      });
    },

    async passwordReset(to, { username, code }) {
      const params = new URLSearchParams({ code, email: to });
      const resetUrl = `${appUrl}/auth/password-reset/verify?${params.toString()}`;
      await sender.send({
        to,
        ...passwordResetTemplate({
          username,
          code,
          resetUrl,
          expiresInMinutes: codeExpiresInMinutes,
          appUrl,
        }),
      });
    },

    async securityNotice(to, { username }) {
      const loginUrl = `${appUrl}/auth/login`;
      await sender.send({
        to,
        ...securityNoticeTemplate({ username, loginUrl, appUrl }),
      });
    },

    async signInLinked(to, { username, provider }) {
      const loginUrl = `${appUrl}/auth/login`;
      await sender.send({
        to,
        ...signInLinkedTemplate({
          username,
          providerName: PROVIDER_NAMES[provider],
          loginUrl,
          appUrl,
        }),
      });
    },
  };
}
