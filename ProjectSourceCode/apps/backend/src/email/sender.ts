import type { Logger } from 'pino';
import { Resend } from 'resend';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSender {
  send(payload: EmailPayload): Promise<void>;
}

export function createResendEmailSender(options: { apiKey: string; from: string }): EmailSender {
  const client = new Resend(options.apiKey);
  return {
    async send({ to, subject, html, text }) {
      const result = await client.emails.send({
        from: options.from,
        to,
        subject,
        html,
        text,
      });
      if (result.error) {
        throw new Error(`Resend send failed: ${result.error.message}`);
      }
    },
  };
}

// Dev fallback and test double: logs the email instead of delivering it.
// Lets teammates work without a Resend account and keeps tests offline.
export function createLoggingEmailSender(logger: Logger): EmailSender {
  return {
    async send({ to, subject, text }) {
      logger.info({ to, subject, text }, 'email (not sent: no provider configured)');
    },
  };
}

export function createEmailSender(
  env: { resendApiKey?: string; from: string },
  logger: Logger,
): EmailSender {
  if (env.resendApiKey) {
    return createResendEmailSender({ apiKey: env.resendApiKey, from: env.from });
  }
  logger.warn('RESEND_API_KEY not set; using logging email sender (emails will not be delivered)');
  return createLoggingEmailSender(logger);
}
