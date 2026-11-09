import type { Logger } from 'pino';

import { type AuthEmails, createAuthEmails } from '../email/auth-emails.js';
import { createEmailSender, type EmailSender } from '../email/sender.js';

export interface Emails {
  auth: AuthEmails;
}

export let emails: Emails;

export interface EmailsConfig {
  resendApiKey?: string;
  from: string;
  appUrl: string;
  codeExpiresInMinutes: number;
}

export function initEmails(config: EmailsConfig, logger: Logger): void {
  const sender: EmailSender = createEmailSender(
    { resendApiKey: config.resendApiKey, from: config.from },
    logger,
  );
  emails = {
    auth: createAuthEmails(sender, {
      appUrl: config.appUrl,
      codeExpiresInMinutes: config.codeExpiresInMinutes,
    }),
  };
}
