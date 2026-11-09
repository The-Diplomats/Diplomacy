import { renderEmail } from './layout.js';

export interface VerifyRegisterData {
  username: string;
  code: string;
  verifyUrl: string;
  expiresInMinutes: number;
}

export function verifyRegisterTemplate(data: VerifyRegisterData) {
  const { username, code, verifyUrl, expiresInMinutes } = data;

  const subject = 'Verify your Diplomacy account';
  const preheader = `Your verification code is ${code}`;
  const headline = `Welcome to Diplomacy, ${username}.`;

  const body = `
    <p style="margin: 0 0 12px 0;">Finish setting up your account by confirming this email address.</p>
    <p style="margin: 0;">Click the button below, or use the code if the button doesn't work.</p>
  `;

  const footerNote = `This code expires in ${expiresInMinutes} minutes. If you didn't try to register, you can ignore this email.`;

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Verify email', url: verifyUrl },
    code,
    footerNote,
  });

  const text = [
    `Welcome to Diplomacy, ${username}.`,
    '',
    'Finish setting up your account by confirming this email address.',
    '',
    `Verify: ${verifyUrl}`,
    '',
    `Or enter this code: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    "If you didn't try to register, you can ignore this email.",
  ].join('\n');

  return { subject, html, text };
}
