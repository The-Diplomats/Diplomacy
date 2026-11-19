import { type BoardState, STARTING_UNITS } from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { resolve } from './resolve.js';

const spring1901: BoardState = {
  year: 1901,
  season: 'spring',
  phaseType: 'movement',
  units: STARTING_UNITS,
  supplyCenters: {},
  dislodged: [],
  standoffs: [],
};

describe('resolve', () => {
  test('holds every unit without orders and moves on to the retreat phase', () => {
    const { nextBoard, results } = resolve(spring1901, []);
    expect(nextBoard.phaseType).toBe('retreat');
    expect(nextBoard.units).toEqual(STARTING_UNITS);
    expect(nextBoard.dislodged).toEqual([]);
    expect(results).toEqual({});
  });

  test('reports a result for each submitted order', () => {
    const { results, nextBoard } = resolve(spring1901, [
      { action: 'move', unit: 'par', to: 'bur' },
      { action: 'move', unit: 'mun', to: 'bur' },
      { action: 'move', unit: 'lon', to: 'nth' },
      { action: 'support', unit: 'mar', supported: 'par', to: 'pic' },
    ]);
    expect(results).toEqual({ par: 'bounced', mun: 'bounced', lon: 'success', mar: 'void' });
    expect(nextBoard.standoffs).toEqual(['bur']);
  });

  test('records where a dislodging attack came from', () => {
    const { nextBoard } = resolve(
      {
        ...spring1901,
        units: [
          { type: 'army', owner: 'germany', location: 'mun' },
          { type: 'army', owner: 'germany', location: 'ruh' },
          { type: 'army', owner: 'france', location: 'bur' },
        ],
      },
      [
        { action: 'move', unit: 'mun', to: 'bur' },
        { action: 'support', unit: 'ruh', supported: 'mun', to: 'bur' },
      ],
    );
    expect(nextBoard.dislodged).toEqual([
      { unit: { type: 'army', owner: 'france', location: 'bur' }, attackerFrom: 'mun' },
    ]);
  });

  test('does not resolve retreat or build phases yet', () => {
    expect(() => resolve({ ...spring1901, phaseType: 'retreat' }, [])).toThrow('NotImplemented');
  });
});
