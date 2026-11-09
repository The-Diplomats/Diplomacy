import type { Logger } from 'pino';

import { type AuthEmails, createAuthEmails } from '../email/auth-emails.js';
import { createEmailSender, type EmailSender } from '../email/sender.js';

export interface Emails {
  auth: AuthEmails;
}

export let emails: Emails;

/** Escape hatch for tests: swap the emails singleton for one backed by a capturing sender. */
export function setEmails(instance: Emails): void {
  emails = instance;
}

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
