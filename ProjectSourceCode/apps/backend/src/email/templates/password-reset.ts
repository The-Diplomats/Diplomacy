import { renderEmail } from './layout.js';

export interface PasswordResetData {
  username: string;
  code: string;
  resetUrl: string;
  expiresInMinutes: number;
  appUrl: string;
}

export function passwordResetTemplate(data: PasswordResetData) {
  const { username, code, resetUrl, expiresInMinutes, appUrl } = data;

  const subject = 'Reset your password';
  const preheader = 'Reset your password';
  const headline = 'Reset your password';

  const body = `Hi ${username}, someone has requested a link to change your password, and you can do this through the link below.`;

  const footerNote = `This code expires in ${expiresInMinutes} minutes. If you didn't request this, please ignore this email. Your password won't change until you access the link above and create a new one.`;

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Change password', url: resetUrl },
    code,
    footerNote,
    appUrl,
  });

  const text = [
    'Reset your password',
    '',
    `Hi ${username}, someone has requested a link to change your password, and you can do this through the link below.`,
    '',
    `Change password: ${resetUrl}`,
    '',
    `Or enter this code: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    "If you didn't request this, please ignore this email. Your password won't change until you access the link above and create a new one.",
  ].join('\n');

  return { subject, html, text };
}
