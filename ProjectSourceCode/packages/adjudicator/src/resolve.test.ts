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

  test('a head-to-head loser does not leave a standoff behind its attacker', () => {
    const { nextBoard } = resolve(
      {
        ...spring1901,
        units: [
          { type: 'army', owner: 'germany', location: 'ber' },
          { type: 'army', owner: 'germany', location: 'sil' },
          { type: 'army', owner: 'russia', location: 'pru' },
        ],
      },
      [
        { action: 'move', unit: 'ber', to: 'pru' },
        { action: 'support', unit: 'sil', supported: 'ber', to: 'pru' },
        { action: 'move', unit: 'pru', to: 'ber' },
      ],
    );
    expect(nextBoard.dislodged).toEqual([
      { unit: { type: 'army', owner: 'russia', location: 'pru' }, attackerFrom: 'ber' },
    ]);
    expect(nextBoard.standoffs).toEqual([]);
  });

  test('a fleet off every non-repeating sea route does not show convoy intent', () => {
    // The Barents Sea borders only the Norwegian Sea among seas, so no route can pass through it.
    const { results } = resolve(
      {
        ...spring1901,
        units: [
          { type: 'army', owner: 'france', location: 'pic' },
          { type: 'fleet', owner: 'france', location: 'bar' },
          { type: 'army', owner: 'germany', location: 'bel' },
          { type: 'fleet', owner: 'england', location: 'eng' },
        ],
      },
      [
        { action: 'move', unit: 'pic', to: 'bel' },
        { action: 'convoy', unit: 'bar', army: 'pic', to: 'bel' },
        { action: 'convoy', unit: 'eng', army: 'pic', to: 'bel' },
        { action: 'move', unit: 'bel', to: 'pic' },
      ],
    );
    expect(results).toMatchObject({ pic: 'bounced', bel: 'bounced' });
  });

  test('does not resolve retreat or build phases yet', () => {
    expect(() => resolve({ ...spring1901, phaseType: 'retreat' }, [])).toThrow('NotImplemented');
  });
});
