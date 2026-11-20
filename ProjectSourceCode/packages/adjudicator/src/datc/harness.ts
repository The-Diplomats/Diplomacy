import { readFileSync } from 'node:fs';

import {
  type BoardState,
  CLASSIC_PROVINCES,
  type MapLocation,
  type Order,
  type Power,
  type Unit,
  type UnitType,
} from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { provinceOf } from '../map.js';
import { adjudicateMovement } from '../movement.js';
import { resolve } from '../resolve.js';
import { retreatOptions } from '../retreats.js';
import { type DatcCase, type DatcOrder, parseDatc, unitKey } from './parse.js';

const DATC_FILE = new URL('../../datc/datc_v2.4_06.txt', import.meta.url);

const allCases = parseDatc(readFileSync(DATC_FILE, 'utf8'));

// Cases whose expected result depends on a rule choice this engine makes differently.
const DEVIATIONS: Readonly<Record<string, string>> = {
  '6.B.9':
    'Support orders name a province, not a coast, so a support for the "wrong" coast still counts',
};

function sortedKeys(units: readonly Unit[]): string[] {
  return units.map(unitKey).sort();
}

function unitFor(
  units: readonly Unit[],
  power: Power,
  unitType: UnitType | null,
  location: MapLocation,
): Unit | undefined {
  return units.find(
    (unit) =>
      provinceOf(unit.location) === provinceOf(location) &&
      unit.owner === power &&
      (unitType === null || unit.type === unitType),
  );
}

// The backend only accepts orders from a unit's owner, for a unit that exists in the phase, so
// orders that fail those checks never reach the adjudicator.
function acceptOrders(units: readonly Unit[], orders: readonly DatcOrder[]): Order[] {
  return orders.flatMap(({ power, unitType, order }) => {
    const unit = unitFor(units, power, unitType, order.unit);
    return unit ? [{ ...order, unit: unit.location }] : [];
  });
}

function acceptedOrders(datcCase: DatcCase, board: BoardState): Order[] {
  switch (board.phaseType) {
    case 'movement':
      return acceptOrders(board.units, datcCase.orders);
    case 'retreat': {
      // Retreats are written as moves in the data file.
      const dislodged = board.dislodged.map(({ unit }) => unit);
      return acceptOrders(dislodged, datcCase.orders).flatMap((order): Order[] => {
        if (order.action === 'move') {
          return [{ action: 'retreat', unit: order.unit, to: order.to }];
        }
        return order.action === 'disband' ? [order] : [];
      });
    }
    case 'build':
      return datcCase.orders.flatMap(({ power, unitType, order }) => {
        if (order.action === 'build') {
          return CLASSIC_PROVINCES[provinceOf(order.unit)].homeOf === power ? [order] : [];
        }
        return acceptOrders(board.units, [{ power, unitType, order }]);
      });
  }
}

// A retreat case gives the position after movement but not where attackers came from or which
// provinces were left empty by a standoff. Rebuild the movement phase from its successful moves,
// resolve it with the engine, and check it reproduces the stated position.
function retreatBoard(datcCase: DatcCase): BoardState {
  const { board } = datcCase;
  const arrivals = datcCase.previousMovement.filter(({ success }) => success);
  const before = [
    ...board.units.map((unit) => {
      const arrival = arrivals.find(
        ({ power, unitType, order }) =>
          order.action === 'move' &&
          power === unit.owner &&
          unitType === unit.type &&
          provinceOf(order.to) === provinceOf(unit.location),
      );
      return arrival ? { ...unit, location: arrival.order.unit } : unit;
    }),
    ...board.dislodged.map(({ unit }) => unit),
  ];
  const movement = adjudicateMovement(before, acceptOrders(before, datcCase.previousMovement));
  expect(sortedKeys(movement.units), 'rebuilt movement: units').toEqual(sortedKeys(board.units));
  expect(
    sortedKeys(movement.dislodged.map(({ unit }) => unit)),
    'rebuilt movement: dislodged',
  ).toEqual(sortedKeys(board.dislodged.map(({ unit }) => unit)));
  return { ...board, dislodged: movement.dislodged, standoffs: movement.standoffs };
}

function runCase(datcCase: DatcCase): void {
  const board = datcCase.board.phaseType === 'retreat' ? retreatBoard(datcCase) : datcCase.board;
  const { nextBoard } = resolve(board, acceptedOrders(datcCase, board));
  expect(sortedKeys(nextBoard.units)).toEqual(sortedKeys(datcCase.expectedUnits));
  // The data file lists a dislodged unit with nowhere to retreat as destroyed, not dislodged.
  const retreating = nextBoard.dislodged.filter(
    (dislodged) => retreatOptions(nextBoard, dislodged).length > 0,
  );
  expect(sortedKeys(retreating.map(({ unit }) => unit))).toEqual(
    sortedKeys(datcCase.expectedDislodged),
  );
}

export function describeDatcSection(section: string): void {
  const cases = allCases.filter((datcCase) => datcCase.id.startsWith(`${section}.`));

  describe(`DATC ${section}`, () => {
    test('has cases', () => {
      expect(cases.length).toBeGreaterThan(0);
    });

    for (const datcCase of cases) {
      const deviation = DEVIATIONS[datcCase.id];
      if (deviation) {
        test.fails(`${datcCase.title} (deviation: ${deviation})`, () => runCase(datcCase));
      } else {
        test(datcCase.title, () => runCase(datcCase));
      }
    }
  });
}
