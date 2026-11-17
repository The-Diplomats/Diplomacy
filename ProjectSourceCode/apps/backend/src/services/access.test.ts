import { afterEach, describe, expect, test } from 'vitest';

import { canSignUp, initAccess, OPEN_ACCESS } from './access.js';

afterEach(() => {
  initAccess(OPEN_ACCESS);
});

describe('canSignUp', () => {
  test('open mode allows any email', () => {
    expect(canSignUp('anyone@example.com')).toBe(true);
  });

  test('invite mode allows only listed emails, case-insensitively', () => {
    initAccess({
      signupMode: 'invite',
      signupAllowlist: new Set(['rez@example.com']),
      maintenanceMode: false,
    });
    expect(canSignUp('rez@example.com')).toBe(true);
    expect(canSignUp('Rez@Example.com')).toBe(true);
    expect(canSignUp('someone@example.com')).toBe(false);
  });

  test('invite mode matches exact addresses only', () => {
    initAccess({
      signupMode: 'invite',
      signupAllowlist: new Set(['rez@example.com']),
      maintenanceMode: false,
    });
    expect(canSignUp('rez+test@example.com')).toBe(false);
  });
});
