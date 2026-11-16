import { describe, expect, test } from 'vitest';

import { isTrueClaim, suggestUsername } from './oauth-providers.js';

describe('suggestUsername', () => {
  test('uses the display name, underscoring spaces', () => {
    expect(suggestUsername({ displayName: 'Ada Lovelace', email: 'x@y.z' })).toBe('Ada_Lovelace');
  });

  test('strips accents and other non-username characters', () => {
    expect(suggestUsername({ displayName: 'José O’Brien', email: 'x@y.z' })).toBe('Jose_OBrien');
  });

  test('falls back to the email local part', () => {
    expect(suggestUsername({ displayName: null, email: 'first.last@uni.edu' })).toBe('firstlast');
  });

  test('truncates to 20 characters', () => {
    expect(suggestUsername({ displayName: 'a'.repeat(30), email: 'x@y.z' })).toHaveLength(20);
  });

  test('falls back to the email when the display name has nothing usable', () => {
    expect(suggestUsername({ displayName: '李小龙', email: 'bruce@y.z' })).toBe('bruce');
  });

  test('returns empty when nothing usable is left', () => {
    expect(suggestUsername({ displayName: '李', email: 'xy@y.z' })).toBe('');
  });
});

describe('isTrueClaim', () => {
  // Microsoft sent `xms_edov: '1'` for a personal account in a real sign-in.
  test.each([true, 1, '1', 'true'])('accepts %j', (value) => {
    expect(isTrueClaim(value)).toBe(true);
  });

  test.each([false, 0, '0', 'false', '', undefined, null, 'yes'])('rejects %j', (value) => {
    expect(isTrueClaim(value)).toBe(false);
  });
});
