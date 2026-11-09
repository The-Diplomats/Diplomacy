import type { EmailSender } from './sender.js';
import { passwordResetTemplate } from './templates/password-reset.js';
import { securityNoticeTemplate } from './templates/security-notice.js';
import { verifyRegisterTemplate } from './templates/verify-register.js';

export interface AuthEmailsConfig {
  /** Base URL of the frontend app, used to build email links. */
  appUrl: string;
  /** Minutes until the verification/reset code expires. */
  codeExpiresInMinutes: number;
}

export interface AuthEmails {
  verifyRegister(
    to: string,
    params: {
      username: string;
      code: string;
      tokenId: string;
    },
  ): Promise<void>;
  passwordReset(
    to: string,
    params: {
      username: string;
      code: string;
      tokenId: string;
    },
  ): Promise<void>;
  securityNotice(to: string, params: { username: string }): Promise<void>;
}

export function createAuthEmails(sender: EmailSender, config: AuthEmailsConfig): AuthEmails {
  const { appUrl, codeExpiresInMinutes } = config;

  return {
    async verifyRegister(to, { username, code, tokenId }) {
      const verifyUrl = `${appUrl}/auth/register/verify?code=${code}&id=${tokenId}`;
      await sender.send({
        to,
        ...verifyRegisterTemplate({
          username,
          code,
          verifyUrl,
          expiresInMinutes: codeExpiresInMinutes,
        }),
      });
    },

    async passwordReset(to, { username, code, tokenId }) {
      const resetUrl = `${appUrl}/auth/password-reset/verify?code=${code}&id=${tokenId}`;
      await sender.send({
        to,
        ...passwordResetTemplate({
          username,
          code,
          resetUrl,
          expiresInMinutes: codeExpiresInMinutes,
        }),
      });
    },

    async securityNotice(to, { username }) {
      const loginUrl = `${appUrl}/auth/login`;
      await sender.send({
        to,
        ...securityNoticeTemplate({ username, loginUrl }),
      });
    },
  };
}
