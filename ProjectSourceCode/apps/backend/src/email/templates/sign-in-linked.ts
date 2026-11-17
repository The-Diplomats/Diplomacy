import { renderEmail } from './layout.js';

export interface SignInLinkedData {
  username: string;
  /** Display name, e.g. "Google". */
  providerName: string;
  loginUrl: string;
  appUrl: string;
}

// Sent when an OAuth sign-in is linked to an existing verified account by
// matching email, so the owner learns about the new way into their account.
export function signInLinkedTemplate(data: SignInLinkedData) {
  const { username, providerName, loginUrl, appUrl } = data;

  const subject = `${providerName} sign-in was added to your account`;
  const preheader = subject;
  const headline = subject;

  const body = `Hi ${username}, you can now sign in to Diplomacy with your ${providerName} account. It was linked because it uses the same verified email address as your account.`;

  const footerNote =
    "If this was you, there's nothing to do. If it wasn't, someone has access to your email or " +
    `${providerName} account. Secure those first.`;

  const html = renderEmail({
    preheader,
    headline,
    body,
    cta: { label: 'Log in', url: loginUrl },
    footerNote,
    appUrl,
  });

  const text = [subject, '', body, '', `Log in: ${loginUrl}`, '', footerNote].join('\n');

  return { subject, html, text };
}
