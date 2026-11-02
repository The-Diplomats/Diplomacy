import { describe, expect, test } from 'vitest';

import { resolve } from './resolve.js';

describe('resolve', () => {
  test('throws NotImplemented until the real adjudicator lands', () => {
    const board = {
      turn: 1,
      units: [],
      supplyCenters: {},
    };
    expect(() => resolve(board, [])).toThrow('NotImplemented');
  });
});
