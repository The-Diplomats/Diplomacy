import { escapeHtml } from './escape.js';

export interface LayoutData {
  preheader: string;
  headline: string;
  body: string;
  cta?: { label: string; url: string };
  code?: string;
  footerNote: string;
}

/**
 * Shared HTML wrapper for transactional emails. Table-based layout so Outlook
 * desktop renders it correctly; inline styles because most email clients strip
 * <style> tags.
 */
export function renderEmail(data: LayoutData): string {
  const { preheader, headline, body, cta, code, footerNote } = data;

  const ctaBlock = cta
    ? `
      <tr>
        <td style="padding: 12px 0 24px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${escapeHtml(cta.url)}" style="display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">${escapeHtml(cta.label)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const codeBlock = code
    ? `
      <tr>
        <td style="padding: 12px 0 24px 0;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Or enter this code:</div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 28px; letter-spacing: 10px; font-weight: 600; color: #111827; text-align: center; padding: 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px;">${escapeHtml(code)}</div>
        </td>
      </tr>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 560px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <tr>
              <td style="padding: 24px 32px; border-bottom: 1px solid #f3f4f6;">
                <div style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Diplomacy</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3;">${escapeHtml(headline)}</h1>
                <div style="font-size: 15px; line-height: 1.6; color: #374151;">${body}</div>
                ${ctaBlock}
                ${codeBlock}
                <div style="font-size: 13px; color: #6b7280; margin-top: 8px;">${escapeHtml(footerNote)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
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
