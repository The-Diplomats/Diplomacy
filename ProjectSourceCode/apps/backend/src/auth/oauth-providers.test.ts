import { describe, expect, test } from 'vitest';

import { identityFromClaims, isTrueClaim, suggestUsername } from './oauth-providers.js';

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

describe('identityFromClaims', () => {
  const base = { iss: 'https://issuer.test', aud: 'client', iat: 0, exp: 0, sub: 'pairwise-sub' };

  describe('google', () => {
    test('keys on sub and lowercases the email', () => {
      const identity = identityFromClaims('google', {
        ...base,
        sub: 'google-sub',
        email: 'Ada@Example.com',
        email_verified: true,
        name: 'Ada',
      });
      expect(identity).toEqual({
        provider: 'google',
        subject: 'google-sub',
        email: 'ada@example.com',
        emailVerified: true,
        displayName: 'Ada',
      });
    });

    test('is unverified unless email_verified is true', () => {
      const identity = identityFromClaims('google', { ...base, email: 'a@b.c' });
      expect(identity?.emailVerified).toBe(false);
    });

    test('returns null without an email', () => {
      expect(identityFromClaims('google', base)).toBeNull();
    });
  });

  describe('microsoft', () => {
    const claims = { ...base, tid: 'tenant', oid: 'object', email: 'a@b.c' };

    // `sub` is pairwise per app, so it must not be the subject.
    test('keys on tid:oid, not sub', () => {
      expect(identityFromClaims('microsoft', claims)?.subject).toBe('tenant:object');
    });

    test('trusts the email only when xms_edov is set', () => {
      expect(identityFromClaims('microsoft', claims)?.emailVerified).toBe(false);
      expect(identityFromClaims('microsoft', { ...claims, xms_edov: '1' })?.emailVerified).toBe(
        true,
      );
    });

    // A tenant admin can set any `email`, so email_verified alone proves nothing.
    test('ignores email_verified', () => {
      const identity = identityFromClaims('microsoft', { ...claims, email_verified: true });
      expect(identity?.emailVerified).toBe(false);
    });

    test('returns null without tid, oid or email', () => {
      expect(identityFromClaims('microsoft', { ...claims, tid: undefined })).toBeNull();
      expect(identityFromClaims('microsoft', { ...claims, oid: undefined })).toBeNull();
      expect(identityFromClaims('microsoft', { ...claims, email: undefined })).toBeNull();
    });
  });
});
