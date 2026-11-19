import type { BoardState } from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { resolve } from './resolve.js';

describe('resolve', () => {
  test('throws NotImplemented until the real adjudicator lands', () => {
    const board: BoardState = {
      year: 1901,
      season: 'spring',
      phaseType: 'movement',
      units: [],
      supplyCenters: {},
      dislodged: [],
      standoffs: [],
    };
    expect(() => resolve(board, [])).toThrow('NotImplemented');
  });
});
