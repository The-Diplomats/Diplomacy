import { renderEmail } from './layout.js';

export interface VerifyRegisterData {
  username: string;
  code: string;
  verifyUrl: string;
  expiresInMinutes: number;
  appUrl: string;
}

export function verifyRegisterTemplate(data: VerifyRegisterData) {
  const { username, code, verifyUrl, expiresInMinutes, appUrl } = data;

  const subject = 'Confirm your email address';
  const preheader = 'Confirm your email address';
  const headline = "We're almost there!";

  const body = `Thanks for signing up for Diplomacy, ${username}. To verify your account, we just need to confirm your email address.`;

  const footerNote = `This code expires in ${expiresInMinutes} minutes. If you didn't request this, please ignore this email.`;

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Confirm email', url: verifyUrl },
    code,
    footerNote,
    appUrl,
  });

  const text = [
    "We're almost there!",
    '',
    `Thanks for signing up for Diplomacy, ${username}. To verify your account, we just need to confirm your email address.`,
    '',
    `Confirm email: ${verifyUrl}`,
    '',
    `Or enter this code: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    "If you didn't request this, please ignore this email.",
  ].join('\n');

  return { subject, html, text };
}
