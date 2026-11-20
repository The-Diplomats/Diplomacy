import {
  type BoardState,
  type Power,
  type ProvinceCode,
  STARTING_UNITS,
} from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { affectedPowers, initialBoard } from './phases.js';
import { resolve } from './resolve.js';

const spring1901 = initialBoard();

const fall1901: BoardState = { ...spring1901, season: 'fall' };

function ownedBy(power: Power, codes: readonly ProvinceCode[]) {
  return Object.fromEntries(codes.map((code) => [code, power]));
}

describe('initialBoard', () => {
  test('starts in Spring 1901 with every home center owned by its power', () => {
    expect(spring1901).toMatchObject({ year: 1901, season: 'spring', phaseType: 'movement' });
    expect(spring1901.units).toEqual(STARTING_UNITS);
    expect(Object.keys(spring1901.supplyCenters)).toHaveLength(22);
    expect(spring1901.supplyCenters.stp).toBe('russia');
  });
});

describe('movement', () => {
  test('skips the retreat phase when nothing is dislodged', () => {
    const { nextBoard, results, winner } = resolve(spring1901, []);
    expect(nextBoard).toMatchObject({ year: 1901, season: 'fall', phaseType: 'movement' });
    expect(nextBoard.units).toEqual(STARTING_UNITS);
    expect(results).toEqual({});
    expect(winner).toBeNull();
  });

  test('reports a result for each submitted order', () => {
    const { results } = resolve(spring1901, [
      { action: 'move', unit: 'par', to: 'bur' },
      { action: 'move', unit: 'mun', to: 'bur' },
      { action: 'move', unit: 'lon', to: 'nth' },
      { action: 'support', unit: 'mar', supported: 'par', to: 'pic' },
    ]);
    expect(results).toEqual({ par: 'bounced', mun: 'bounced', lon: 'success', mar: 'void' });
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
    expect(nextBoard.phaseType).toBe('retreat');
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

  test('disbands a dislodged unit with nowhere to go and skips the retreat phase', () => {
    const { nextBoard } = resolve(
      {
        ...spring1901,
        units: [
          { type: 'fleet', owner: 'russia', location: 'bla' },
          { type: 'fleet', owner: 'russia', location: 'con' },
          { type: 'army', owner: 'russia', location: 'arm' },
          { type: 'army', owner: 'russia', location: 'smy' },
          { type: 'fleet', owner: 'turkey', location: 'ank' },
        ],
      },
      [
        { action: 'move', unit: 'bla', to: 'ank' },
        { action: 'support', unit: 'con', supported: 'bla', to: 'ank' },
      ],
    );
    expect(nextBoard).toMatchObject({ season: 'fall', phaseType: 'movement', dislodged: [] });
    expect(nextBoard.units.some((unit) => unit.owner === 'turkey')).toBe(false);
  });
});

describe('retreats', () => {
  const retreatBoard: BoardState = {
    ...spring1901,
    phaseType: 'retreat',
    units: [
      { type: 'army', owner: 'germany', location: 'bur' },
      { type: 'army', owner: 'italy', location: 'pie' },
    ],
    dislodged: [
      { unit: { type: 'army', owner: 'france', location: 'bur' }, attackerFrom: 'mun' },
      { unit: { type: 'army', owner: 'austria', location: 'pie' }, attackerFrom: 'ven' },
    ],
  };

  test('moves retreating units and goes on to Fall movement', () => {
    const { nextBoard, results } = resolve(retreatBoard, [
      { action: 'retreat', unit: 'bur', to: 'gas' },
      { action: 'disband', unit: 'pie' },
    ]);
    expect(nextBoard).toMatchObject({ season: 'fall', phaseType: 'movement', dislodged: [] });
    expect(nextBoard.units).toContainEqual({ type: 'army', owner: 'france', location: 'gas' });
    expect(nextBoard.units.some((unit) => unit.owner === 'austria')).toBe(false);
    expect(results).toEqual({ bur: 'success', pie: 'success' });
  });

  test('disbands units that retreat into the same province', () => {
    const { nextBoard, results } = resolve(retreatBoard, [
      { action: 'retreat', unit: 'bur', to: 'mar' },
      { action: 'retreat', unit: 'pie', to: 'mar' },
    ]);
    expect(results).toEqual({ bur: 'disbanded', pie: 'disbanded' });
    expect(nextBoard.units).toEqual(retreatBoard.units);
  });

  test('disbands a unit that retreats toward its attacker', () => {
    const { results, nextBoard } = resolve(retreatBoard, [
      { action: 'retreat', unit: 'bur', to: 'mun' },
    ]);
    expect(results).toEqual({ bur: 'void' });
    expect(nextBoard.units).toEqual(retreatBoard.units);
  });

  test('an army ignores a coast in its retreat; a fleet must name a reachable one', () => {
    const coastBoard: BoardState = {
      ...retreatBoard,
      units: [],
      dislodged: [
        { unit: { type: 'army', owner: 'france', location: 'gas' }, attackerFrom: 'bre' },
      ],
    };
    const { results, nextBoard } = resolve(coastBoard, [
      { action: 'retreat', unit: 'gas', to: 'spa/nc' },
    ]);
    expect(results).toEqual({ gas: 'success' });
    expect(nextBoard.units).toEqual([{ type: 'army', owner: 'france', location: 'spa' }]);

    const fleetBoard: BoardState = {
      ...coastBoard,
      dislodged: [
        { unit: { type: 'fleet', owner: 'france', location: 'gas' }, attackerFrom: 'bre' },
      ],
    };
    expect(resolve(fleetBoard, [{ action: 'retreat', unit: 'gas', to: 'spa/sc' }]).results).toEqual(
      { gas: 'void' },
    );
    expect(
      resolve(fleetBoard, [{ action: 'retreat', unit: 'gas', to: 'spa' }]).nextBoard.units,
    ).toEqual([{ type: 'fleet', owner: 'france', location: 'spa/nc' }]);
  });
});

describe('end of year', () => {
  test('hands supply centers to the units holding them and opens builds', () => {
    const { nextBoard } = resolve(fall1901, [
      { action: 'move', unit: 'mar', to: 'spa' },
      { action: 'move', unit: 'par', to: 'bur' },
    ]);
    expect(nextBoard).toMatchObject({ year: 1901, season: 'fall', phaseType: 'build' });
    expect(nextBoard.supplyCenters.spa).toBe('france');
    // An empty center keeps its owner; only occupation by another power changes it.
    expect(nextBoard.supplyCenters.mar).toBe('france');
    expect(affectedPowers(nextBoard)).toEqual(['france']);
  });

  test('skips the build phase when no power has a choice to make', () => {
    const { nextBoard } = resolve(fall1901, []);
    expect(nextBoard).toMatchObject({ year: 1902, season: 'spring', phaseType: 'movement' });
  });

  test('removes the units of a power left with no centers without waiting on its orders', () => {
    const board: BoardState = {
      ...fall1901,
      units: [
        { type: 'army', owner: 'germany', location: 'ruh' },
        { type: 'army', owner: 'france', location: 'par' },
      ],
      supplyCenters: ownedBy('france', ['par']),
    };
    const { nextBoard } = resolve(board, []);
    expect(nextBoard).toMatchObject({ year: 1902, season: 'spring', phaseType: 'movement' });
    expect(nextBoard.units).toEqual([{ type: 'army', owner: 'france', location: 'par' }]);
  });

  test('opens builds for a power with a choice and still removes an eliminated power', () => {
    const board: BoardState = {
      ...fall1901,
      units: [
        { type: 'army', owner: 'germany', location: 'ruh' },
        { type: 'army', owner: 'france', location: 'pic' },
      ],
      supplyCenters: ownedBy('france', ['par', 'bre']),
    };
    const movement = resolve(board, []);
    expect(movement.nextBoard.phaseType).toBe('build');
    expect(affectedPowers(movement.nextBoard)).toEqual(['france']);
    const builds = resolve(movement.nextBoard, []);
    expect(builds.nextBoard.units).toEqual([{ type: 'army', owner: 'france', location: 'pic' }]);
  });

  test('waives builds for a power with no free home center', () => {
    const board: BoardState = {
      ...fall1901,
      units: [
        { type: 'army', owner: 'france', location: 'par' },
        { type: 'army', owner: 'france', location: 'mar' },
        { type: 'fleet', owner: 'france', location: 'bre' },
        { type: 'army', owner: 'france', location: 'gas' },
      ],
      supplyCenters: ownedBy('france', ['par', 'mar', 'bre', 'por']),
    };
    const { nextBoard } = resolve(board, [{ action: 'move', unit: 'gas', to: 'spa' }]);
    expect(nextBoard.supplyCenters.spa).toBe('france');
    expect(nextBoard).toMatchObject({ year: 1902, season: 'spring', phaseType: 'movement' });
  });

  test('declares a solo winner on reaching 18 supply centers', () => {
    const board: BoardState = {
      ...fall1901,
      units: [
        { type: 'army', owner: 'england', location: 'ruh' },
        { type: 'army', owner: 'england', location: 'bur' },
        { type: 'army', owner: 'germany', location: 'mun' },
      ],
      supplyCenters: {
        ...ownedBy('england', [
          'lon',
          'lvp',
          'edi',
          'bre',
          'par',
          'mar',
          'nwy',
          'swe',
          'den',
          'hol',
          'bel',
          'spa',
          'por',
          'tun',
          'ber',
          'vie',
          'bud',
        ]),
        mun: 'germany',
      },
    };
    expect(resolve(board, []).winner).toBeNull();
    const movement = resolve(board, [
      { action: 'move', unit: 'ruh', to: 'mun' },
      { action: 'support', unit: 'bur', supported: 'ruh', to: 'mun' },
    ]);
    // The dislodged German army can retreat, so ownership changes only after the Fall retreat.
    expect(movement.nextBoard.phaseType).toBe('retreat');
    expect(movement.winner).toBeNull();
    const retreat = resolve(movement.nextBoard, [{ action: 'retreat', unit: 'mun', to: 'kie' }]);
    expect(retreat.nextBoard.supplyCenters.mun).toBe('england');
    expect(retreat.winner).toBe('england');
  });
});

describe('builds', () => {
  const buildBoard: BoardState = {
    ...fall1901,
    phaseType: 'build',
    units: [
      { type: 'army', owner: 'russia', location: 'war' },
      { type: 'army', owner: 'france', location: 'par' },
      { type: 'army', owner: 'france', location: 'bur' },
    ],
    supplyCenters: { ...ownedBy('russia', ['mos', 'stp', 'war']), par: 'france' },
  };

  test('builds and disbands, then starts the next year', () => {
    expect(affectedPowers(buildBoard)).toEqual(['france', 'russia']);
    const { nextBoard, results } = resolve(buildBoard, [
      { action: 'build', unit: 'stp/nc', unitType: 'fleet' },
      { action: 'build', unit: 'mos', unitType: 'army' },
      { action: 'disband', unit: 'bur' },
    ]);
    expect(results).toEqual({ 'stp/nc': 'success', mos: 'success', bur: 'success' });
    expect(nextBoard).toMatchObject({ year: 1902, season: 'spring', phaseType: 'movement' });
    expect(nextBoard.units).toHaveLength(4);
  });

  test('disbands for a power that orders too few disbands', () => {
    const { nextBoard } = resolve(buildBoard, []);
    expect(nextBoard.units.filter((unit) => unit.owner === 'france')).toEqual([
      { type: 'army', owner: 'france', location: 'par' },
    ]);
  });
});
