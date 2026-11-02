import { describe, expect, test } from 'vitest';

import { classifySurface, extractForwardedHost } from './surface.js';

describe('classifySurface', () => {
  test.each([
    ['localhost', 'dev'],
    ['localhost:3001', 'dev'],
    ['127.0.0.1', 'dev'],
    ['127.0.0.1:3001', 'dev'],
    ['api.diplomacy.gg', 'api'],
    ['api.dev.diplomacy.gg', 'api'],
    ['api.stage.diplomacy.gg', 'api'],
    ['api.diplomacy.gg:443', 'api'],
    ['API.DIPLOMACY.GG', 'api'],
    ['admin.diplomacy.gg', 'admin'],
    ['admin.dev.diplomacy.gg', 'admin'],
    ['app.diplomacy.gg', 'unknown'],
    ['diplomacy.gg', 'unknown'],
    ['evil.com', 'unknown'],
    ['', 'unknown'],
    [undefined, 'unknown'],
  ] as const)('classifies %s as %s', (input, expected) => {
    expect(classifySurface(input)).toBe(expected);
  });
});

describe('extractForwardedHost', () => {
  test('prefers x-forwarded-host over host', () => {
    expect(
      extractForwardedHost({ host: 'internal:9000', 'x-forwarded-host': 'api.diplomacy.gg' }),
    ).toBe('api.diplomacy.gg');
  });

  test('takes leftmost in comma-separated list', () => {
    expect(extractForwardedHost({ 'x-forwarded-host': 'api.diplomacy.gg, inner' })).toBe(
      'api.diplomacy.gg',
    );
  });

  test('handles x-forwarded-host as array', () => {
    expect(extractForwardedHost({ 'x-forwarded-host': ['api.diplomacy.gg', 'inner'] })).toBe(
      'api.diplomacy.gg',
    );
  });

  test('falls back to host when no forwarded', () => {
    expect(extractForwardedHost({ host: 'localhost:3001' })).toBe('localhost:3001');
  });

  test('returns undefined when both absent', () => {
    expect(extractForwardedHost({})).toBeUndefined();
  });
});
