import { renderEmail } from './layout.js';

export interface SecurityNoticeData {
  username: string;
  loginUrl: string;
}

// Sent when someone tries to register using an email that already has an
// account. The register endpoint still responds generically, so an enumerator
// can't learn whether the address exists; the real owner gets this note so
// they know the attempt happened.
export function securityNoticeTemplate(data: SecurityNoticeData) {
  const { username, loginUrl } = data;

  const subject = 'Someone tried to register with your email';
  const preheader = 'No new account was created. Here is what happened.';
  const headline = 'Someone tried to register with your email';

  const body = `
    <p style="margin: 0 0 12px 0;">Hi ${username}, a signup attempt was made on Diplomacy using your email address.</p>
    <p style="margin: 0;">Since you already have an account, nothing changed and no new account was created. If this was you, you can log in below.</p>
  `;

  const footerNote =
    "If this wasn't you, you can safely ignore this email. Your account wasn't affected.";

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Log in', url: loginUrl },
    footerNote,
  });

  const text = [
    `Hi ${username},`,
    '',
    'A signup attempt was made on Diplomacy using your email address.',
    'Since you already have an account, nothing changed and no new account was created.',
    '',
    `If this was you, you can log in: ${loginUrl}`,
    "If this wasn't you, you can safely ignore this email.",
  ].join('\n');

  return { subject, html, text };
}
