import { renderEmail } from './layout.js';

export interface SecurityNoticeData {
  username: string;
  loginUrl: string;
  appUrl: string;
}

// Sent when someone tries to register using an email that already has an
// account. The register endpoint still responds generically, so an enumerator
// can't learn whether the address exists; the real owner gets this note so
// they know the attempt happened.
export function securityNoticeTemplate(data: SecurityNoticeData) {
  const { username, loginUrl, appUrl } = data;

  const subject = 'Someone tried to register with your email';
  const preheader = 'Someone tried to register with your email';
  const headline = 'Someone tried to register with your email';

  const body = `Hi ${username}, a signup attempt was made on Diplomacy using your email address. Since you already have an account, nothing changed and no new account was created.`;

  const footerNote =
    "If this was you, you can log in above. If it wasn't, you can safely ignore this email. Your account wasn't affected.";

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Log in', url: loginUrl },
    footerNote,
    appUrl,
  });

  const text = [
    'Someone tried to register with your email',
    '',
    `Hi ${username}, a signup attempt was made on Diplomacy using your email address. Since you already have an account, nothing changed and no new account was created.`,
    '',
    `Log in: ${loginUrl}`,
    '',
    "If this was you, you can log in above. If it wasn't, you can safely ignore this email.",
  ].join('\n');

  return { subject, html, text };
}
