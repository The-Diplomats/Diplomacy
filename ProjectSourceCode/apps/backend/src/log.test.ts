import { describe, expect, test } from 'vitest';

import { redactRequestSecrets } from './log.js';

describe('redactRequestSecrets', () => {
  test('masks the OAuth code in both url and query, keeping other params', () => {
    const redacted = redactRequestSecrets({
      method: 'GET',
      url: '/auth/oauth/google/callback?code=4/0AeanS0R!x$y&state=abc',
      query: { code: '4/0AeanS0R!x$y', state: 'abc' },
    });
    expect(redacted.url).not.toContain('0AeanS0R');
    expect(new URL(redacted.url, 'http://x').searchParams.get('state')).toBe('abc');
    expect(redacted.query).toEqual({ code: '[Redacted]', state: 'abc' });
    expect(redacted.method).toBe('GET');
  });

  test('leaves requests without secret params untouched', () => {
    const req = { url: '/games?limit=10', query: { limit: '10' } };
    expect(redactRequestSecrets(req)).toBe(req);
  });
});
