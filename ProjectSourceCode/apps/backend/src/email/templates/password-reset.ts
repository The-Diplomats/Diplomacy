import { renderEmail } from './layout.js';

export interface PasswordResetData {
  username: string;
  code: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordResetTemplate(data: PasswordResetData) {
  const { username, code, resetUrl, expiresInMinutes } = data;

  const subject = 'Reset your Diplomacy password';
  const preheader = `Your password reset code is ${code}`;
  const headline = 'Reset your password';

  const body = `
    <p style="margin: 0 0 12px 0;">Hi ${username}, we got a request to reset your Diplomacy password.</p>
    <p style="margin: 0;">Click the button below, or use the code if the button doesn't work.</p>
  `;

  const footerNote = `This code expires in ${expiresInMinutes} minutes. If you didn't request a password reset, you can ignore this email.`;

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Reset password', url: resetUrl },
    code,
    footerNote,
  });

  const text = [
    `Hi ${username},`,
    '',
    'We got a request to reset your Diplomacy password.',
    '',
    `Reset: ${resetUrl}`,
    '',
    `Or enter this code: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    "If you didn't request a password reset, you can ignore this email.",
  ].join('\n');

  return { subject, html, text };
}
