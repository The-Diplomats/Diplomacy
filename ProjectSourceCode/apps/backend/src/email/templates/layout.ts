import { escapeHtml } from './escape.js';

export interface LayoutData {
  preheader: string;
  headline: string;
  body: string;
  cta?: { label: string; url: string };
  code?: string;
  footerNote: string;
  appUrl: string;
}

const colors = {
  outer: '#f5f5f3',
  card: '#ffffff',
  inner: '#f5f5f3',
  fg: '#111111',
  fg2: '#555555',
  fg3: '#888888',
  codeBg: '#ffffff',
  codeBorder: '#e5e5e5',
} as const;

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderEmail(data: LayoutData): string {
  const { preheader, headline, body, cta, code, footerNote, appUrl } = data;

  const ctaBlock = cta
    ? `
      <tr>
        <td align="center" style="padding: 0 0 24px 0;">
          <a href="${escapeHtml(cta.url)}" style="display: inline-block; padding: 14px 28px; background: ${colors.fg}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; line-height: 1.5;">${escapeHtml(cta.label)}</a>
        </td>
      </tr>`
    : '';

  const codeBlock = code
    ? `
      <tr>
        <td align="center" style="padding: 0 0 32px 0;">
          <div style="font-size: 13px; color: ${colors.fg3}; margin: 0 0 10px 0;">Or enter this code</div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 28px; letter-spacing: 10px; text-indent: 10px; font-weight: 600; color: ${colors.fg}; padding: 16px 20px; background: ${colors.codeBg}; border: 1px solid ${colors.codeBorder}; border-radius: 8px; display: inline-block;">${escapeHtml(code)}</div>
        </td>
      </tr>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin: 0; padding: 0; background: ${colors.outer}; font-family: ${fontStack}; color: ${colors.fg}; text-align: center;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${colors.outer};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 640px; background: ${colors.card};">
            <tr>
              <td align="center" style="padding: 24px 32px 8px 32px;">
                <img src="${escapeHtml(appUrl)}/brand/wordmark.png" alt="Diplomacy" width="160" height="51" style="display: inline-block; border: 0; outline: none; text-decoration: none; height: auto; max-width: 160px;">
              </td>
            </tr>
            <tr>
              <td style="padding: 0 24px 24px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${colors.inner}; border-radius: 10px;">
                  <tr>
                    <td align="center" style="padding: 56px 32px;">
                      <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 600; color: ${colors.fg}; line-height: 1.3;">${escapeHtml(headline)}</h1>
                      <div style="font-size: 16px; line-height: 1.55; color: ${colors.fg2}; max-width: 420px; margin: 0 auto 32px auto;">${body}</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${ctaBlock}
                        ${codeBlock}
                      </table>
                      <div style="font-size: 13px; color: ${colors.fg3}; max-width: 400px; margin: 0 auto; line-height: 1.5;">${escapeHtml(footerNote)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: ${colors.fg3};">
                Diplomacy. If you have questions, reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
