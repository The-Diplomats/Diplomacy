import { readFileSync } from 'node:fs';

import {
  type BoardState,
  FLEET_ADJACENCY,
  type Order,
  POWERS,
  type Unit,
} from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { parseDatc } from './datc/parse.js';
import { defaultOrders, legalOrders, validateOrder, validateOrders } from './legal.js';
import { isArmyAdjacent, provinceOf } from './map.js';
import { adjudicateMovement } from './movement.js';
import { initialBoard } from './phases.js';

const spring1901 = initialBoard();

function boardWith(units: Unit[], overrides: Partial<BoardState> = {}): BoardState {
  return { ...spring1901, units, supplyCenters: {}, ...overrides };
}

function reason(board: BoardState, power: Unit['owner'], order: Order): string | null {
  const check = validateOrder(board, power, order);
  return check.legal ? null : check.reason;
}

describe('validateOrder in movement (DATC 6.A)', () => {
  const units: Unit[] = [
    { type: 'fleet', owner: 'england', location: 'nth' },
    { type: 'army', owner: 'england', location: 'lvp' },
    { type: 'army', owner: 'england', location: 'yor' },
    { type: 'fleet', owner: 'england', location: 'lon' },
    { type: 'fleet', owner: 'germany', location: 'kie' },
    { type: 'army', owner: 'italy', location: 'ven' },
    { type: 'fleet', owner: 'italy', location: 'rom' },
    { type: 'army', owner: 'austria', location: 'tri' },
  ];
  const board = boardWith(units);

  test.each<[string, Unit['owner'], Order]>([
    [
      '6.A.1 move to a non-adjacent province',
      'england',
      { action: 'move', unit: 'nth', to: 'pic' },
    ],
    ['6.A.2 army to sea', 'england', { action: 'move', unit: 'lvp', to: 'iri' }],
    ['6.A.3 fleet to land', 'germany', { action: 'move', unit: 'kie', to: 'mun' }],
    ['6.A.4 move to own province', 'germany', { action: 'move', unit: 'kie', to: 'kie' }],
    [
      '6.A.5 convoy to own province',
      'england',
      { action: 'convoy', unit: 'nth', army: 'yor', to: 'yor' },
    ],
    ['6.A.6 ordering a unit of another power', 'england', { action: 'hold', unit: 'kie' }],
    [
      '6.A.7 only armies can be convoyed',
      'england',
      { action: 'convoy', unit: 'nth', army: 'lon', to: 'bel' },
    ],
    [
      '6.A.8 support to hold yourself',
      'italy',
      { action: 'support', unit: 'ven', supported: 'ven' },
    ],
    ['6.A.9 fleets must follow the coast', 'italy', { action: 'move', unit: 'rom', to: 'ven' }],
    [
      '6.A.10 support on an unreachable destination',
      'italy',
      { action: 'support', unit: 'rom', supported: 'tri', to: 'ven' },
    ],
    [
      'a fleet move by convoy',
      'england',
      { action: 'move', unit: 'lon', to: 'nth', viaConvoy: true },
    ],
    ['a retreat in a movement phase', 'england', { action: 'retreat', unit: 'lvp', to: 'wal' }],
    [
      'a convoy by a fleet on the coast',
      'england',
      { action: 'convoy', unit: 'lon', army: 'yor', to: 'bel' },
    ],
  ])('rejects %s', (_label, power, order) => {
    expect(reason(board, power, order)).not.toBeNull();
  });

  test.each<[string, Unit['owner'], Order]>([
    ['a move', 'england', { action: 'move', unit: 'lvp', to: 'wal' }],
    ['a convoyed move with a fleet at sea', 'england', { action: 'move', unit: 'yor', to: 'nwy' }],
    ['a convoy on a route', 'england', { action: 'convoy', unit: 'nth', army: 'yor', to: 'nwy' }],
    ['a support to hold', 'italy', { action: 'support', unit: 'ven', supported: 'rom' }],
    [
      'a support of a foreign move',
      'italy',
      { action: 'support', unit: 'ven', supported: 'tri', to: 'tyr' },
    ],
  ])('accepts %s', (_label, power, order) => {
    expect(reason(board, power, order)).toBeNull();
  });

  test('rejects a convoyed move when no fleet at sea could carry it', () => {
    const noFleet = boardWith([{ type: 'army', owner: 'germany', location: 'yor' }]);
    expect(reason(noFleet, 'germany', { action: 'move', unit: 'yor', to: 'hol' })).toMatch(
      /convoy/,
    );
  });
});

describe('validateOrder in retreat and build phases', () => {
  const retreatBoard = boardWith([{ type: 'army', owner: 'germany', location: 'bur' }], {
    phaseType: 'retreat',
    dislodged: [{ unit: { type: 'army', owner: 'france', location: 'bur' }, attackerFrom: 'mun' }],
  });

  test('allows a retreat to an option and to disband, nothing else', () => {
    expect(
      reason(retreatBoard, 'france', { action: 'retreat', unit: 'bur', to: 'gas' }),
    ).toBeNull();
    expect(reason(retreatBoard, 'france', { action: 'disband', unit: 'bur' })).toBeNull();
    expect(reason(retreatBoard, 'france', { action: 'retreat', unit: 'bur', to: 'mun' })).toMatch(
      /cannot retreat/,
    );
    expect(reason(retreatBoard, 'germany', { action: 'disband', unit: 'bur' })).toMatch(
      /belongs to france/,
    );
  });

  const buildBoard = boardWith(
    [
      { type: 'army', owner: 'russia', location: 'war' },
      { type: 'army', owner: 'france', location: 'par' },
      { type: 'army', owner: 'france', location: 'bur' },
    ],
    {
      season: 'fall',
      phaseType: 'build',
      supplyCenters: { mos: 'russia', stp: 'russia', war: 'russia', par: 'france', ber: 'russia' },
    },
  );

  test('allows builds only at free owned home centers, with a coast for split coasts', () => {
    expect(
      reason(buildBoard, 'russia', { action: 'build', unit: 'mos', unitType: 'army' }),
    ).toBeNull();
    expect(
      reason(buildBoard, 'russia', { action: 'build', unit: 'stp/sc', unitType: 'fleet' }),
    ).toBeNull();
    expect(
      reason(buildBoard, 'russia', { action: 'build', unit: 'stp', unitType: 'fleet' }),
    ).toMatch(/cannot be built/);
    expect(
      reason(buildBoard, 'russia', { action: 'build', unit: 'war', unitType: 'army' }),
    ).toMatch(/occupied/);
    expect(
      reason(buildBoard, 'russia', { action: 'build', unit: 'ber', unitType: 'army' }),
    ).toMatch(/not a home/);
    expect(
      reason(buildBoard, 'france', { action: 'build', unit: 'bre', unitType: 'fleet' }),
    ).toMatch(/no builds owed/);
    expect(reason(buildBoard, 'france', { action: 'disband', unit: 'bur' })).toBeNull();
  });

  test('validateOrders caps builds and disbands at what is owed and rejects duplicates', () => {
    // Two builds owed and three legal build sites, so only the cap stops the third.
    const twoOwed = boardWith([{ type: 'army', owner: 'russia', location: 'ukr' }], {
      season: 'fall',
      phaseType: 'build',
      supplyCenters: { mos: 'russia', stp: 'russia', sev: 'russia' },
    });
    expect(
      validateOrders(twoOwed, 'russia', [
        { action: 'build', unit: 'mos', unitType: 'army' },
        { action: 'build', unit: 'stp/nc', unitType: 'fleet' },
        { action: 'build', unit: 'sev', unitType: 'army' },
      ]),
    ).toEqual([{ index: 2, reason: 'russia is owed only 2 build(s)' }]);
    expect(
      validateOrders(buildBoard, 'france', [
        { action: 'disband', unit: 'bur' },
        { action: 'disband', unit: 'par' },
      ]),
    ).toEqual([{ index: 1, reason: 'france owes only 1 disband(s)' }]);
    expect(
      validateOrders(spring1901, 'france', [
        { action: 'hold', unit: 'par' },
        { action: 'move', unit: 'par', to: 'bur' },
      ]),
    ).toEqual([{ index: 1, reason: 'Another order already covers par' }]);
  });
});

describe('legalOrders', () => {
  test('lists every opening option for the French army in Paris', () => {
    const paris = legalOrders(spring1901, 'france').filter(({ unit }) => unit === 'par');
    expect(paris).toContainEqual({ action: 'hold', unit: 'par' });
    expect(paris).toContainEqual({ action: 'move', unit: 'par', to: 'bur' });
    expect(paris).toContainEqual({ action: 'support', unit: 'par', supported: 'mar', to: 'bur' });
    expect(paris).not.toContainEqual({ action: 'move', unit: 'par', to: 'mun' });
  });

  test('lists retreats and builds for the phase', () => {
    const retreatBoard = boardWith([], {
      phaseType: 'retreat',
      dislodged: [
        { unit: { type: 'fleet', owner: 'turkey', location: 'ank' }, attackerFrom: 'bla' },
      ],
    });
    expect(legalOrders(retreatBoard, 'turkey')).toEqual([
      { action: 'retreat', unit: 'ank', to: 'arm' },
      { action: 'retreat', unit: 'ank', to: 'con' },
      { action: 'disband', unit: 'ank' },
    ]);
    const buildBoard = boardWith([], {
      season: 'fall',
      phaseType: 'build',
      supplyCenters: { stp: 'russia' },
    });
    expect(legalOrders(buildBoard, 'russia')).toEqual([
      { action: 'build', unit: 'stp', unitType: 'army' },
      { action: 'build', unit: 'stp/nc', unitType: 'fleet' },
      { action: 'build', unit: 'stp/sc', unitType: 'fleet' },
    ]);
  });

  // Every listed order, given what it depends on, is carried out by the engine and never voided.
  // About 10k adjudications: ~0.5 s locally, a few times that on a CI runner, so it gets more
  // than Vitest's 5 s default.
  test(
    'every legal order on every DATC movement board survives adjudication',
    { timeout: 20_000 },
    () => {
      const datc = readFileSync(new URL('../datc/datc_v2.4_06.txt', import.meta.url), 'utf8');
      const boards = [
        spring1901,
        ...parseDatc(datc)
          .map(({ board }) => board)
          .filter((board) => board.phaseType === 'movement'),
      ];
      let checked = 0;
      for (const board of boards) {
        for (const power of POWERS) {
          for (const order of legalOrders(board, power)) {
            const dependency = dependencyOf(board, order);
            if (dependency === undefined) {
              continue;
            }
            const { results } = adjudicateMovement(board.units, [order, ...dependency]);
            expect(results[order.unit], JSON.stringify(order)).not.toBe('void');
            checked += 1;
          }
        }
      }
      expect(checked).toBeGreaterThan(10_000);
    },
  );
});

// The orders another unit must give for `order` to apply, or undefined when one other order
// isn't enough (a convoy to an adjacent province can need a whole chain of fleets).
function dependencyOf(board: BoardState, order: Order): Order[] | undefined {
  const unitAt = (province: string) =>
    board.units.find((unit) => provinceOf(unit.location) === province);
  if (order.action === 'support' && order.to !== undefined) {
    const supported = unitAt(order.supported);
    if (!supported) {
      return undefined;
    }
    // A fleet needs the exact coast it would reach in the target province.
    const to =
      supported.type === 'fleet'
        ? FLEET_ADJACENCY[supported.location].find((location) => provinceOf(location) === order.to)
        : order.to;
    return to ? [{ action: 'move', unit: supported.location, to }] : undefined;
  }
  if (order.action === 'convoy') {
    const army = unitAt(order.army);
    if (!army || isArmyAdjacent(order.army, order.to)) {
      return undefined;
    }
    return [{ action: 'move', unit: army.location, to: order.to }];
  }
  return [];
}

describe('convoys to an adjacent province', () => {
  // England's army in Liverpool swaps with France's army in Wales, carried by a French fleet.
  const board = boardWith([
    { type: 'army', owner: 'england', location: 'lvp' },
    { type: 'fleet', owner: 'england', location: 'nth' },
    { type: 'fleet', owner: 'france', location: 'iri' },
    { type: 'army', owner: 'france', location: 'wal' },
  ]);
  const frenchOrders: Order[] = [
    { action: 'convoy', unit: 'iri', army: 'lvp', to: 'wal' },
    { action: 'move', unit: 'wal', to: 'lvp' },
  ];

  test('legalOrders offers the explicit convoy, which the engine carries out', () => {
    const viaConvoy: Order = { action: 'move', unit: 'lvp', to: 'wal', viaConvoy: true };
    expect(legalOrders(board, 'england')).toContainEqual(viaConvoy);
    expect(adjudicateMovement(board.units, [viaConvoy, ...frenchOrders]).results).toMatchObject({
      lvp: 'success',
      wal: 'success',
    });
  });

  test("accepts an own fleet's convoy order off the route as the signal to convoy", () => {
    const intent: Order = { action: 'convoy', unit: 'nth', army: 'lvp', to: 'wal' };
    expect(reason(board, 'england', intent)).toBeNull();
    const { results } = adjudicateMovement(board.units, [
      { action: 'move', unit: 'lvp', to: 'wal' },
      intent,
      ...frenchOrders,
    ]);
    expect(results).toMatchObject({ lvp: 'success', nth: 'success', wal: 'success' });
  });
});

describe('defaultOrders', () => {
  test('holds every unit without an order in movement', () => {
    expect(
      defaultOrders(spring1901, 'italy', [{ action: 'move', unit: 'ven', to: 'tyr' }]),
    ).toEqual([
      { action: 'hold', unit: 'rom' },
      { action: 'hold', unit: 'nap' },
    ]);
  });

  test('disbands unordered dislodged units in a retreat phase', () => {
    const board = boardWith([], {
      phaseType: 'retreat',
      dislodged: [
        { unit: { type: 'army', owner: 'france', location: 'bur' }, attackerFrom: 'mun' },
      ],
    });
    expect(defaultOrders(board, 'france')).toEqual([{ action: 'disband', unit: 'bur' }]);
  });

  test('fills disbands still owed in civil-disorder order and waives builds', () => {
    const board = boardWith(
      [
        { type: 'army', owner: 'france', location: 'par' },
        { type: 'army', owner: 'france', location: 'pic' },
        { type: 'fleet', owner: 'france', location: 'gol' },
      ],
      { season: 'fall', phaseType: 'build', supplyCenters: { par: 'france' } },
    );
    expect(defaultOrders(board, 'france')).toEqual([
      { action: 'disband', unit: 'gol' },
      { action: 'disband', unit: 'pic' },
    ]);
    expect(defaultOrders(board, 'france', [{ action: 'disband', unit: 'pic' }])).toEqual([
      { action: 'disband', unit: 'gol' },
    ]);
    expect(
      defaultOrders(
        { ...board, supplyCenters: { par: 'france', bre: 'france', mar: 'france', spa: 'france' } },
        'france',
      ),
    ).toEqual([]);
  });
});
