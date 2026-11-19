import { readFileSync } from 'node:fs';

import type { Order, PhaseType } from '@diplomacy/game-types';
import { describe, expect, test } from 'vitest';

import { provinceOf } from '../map.js';
import { resolve } from '../resolve.js';
import { retreatOptions } from '../retreats.js';
import { type DatcCase, parseDatc, unitKey } from './parse.js';

const DATC_FILE = new URL('../../datc/datc_v2.4_06.txt', import.meta.url);

const allCases = parseDatc(readFileSync(DATC_FILE, 'utf8'));

const SUPPORTED_PHASES: readonly PhaseType[] = ['movement'];

// Cases whose expected result depends on a rule choice this engine makes differently.
const DEVIATIONS: Readonly<Record<string, string>> = {
  '6.B.9':
    'Support orders name a province, not a coast, so a support for the "wrong" coast still counts',
};

// The backend only accepts orders from a unit's owner, for a unit that exists, so orders
// that fail those checks never reach the adjudicator.
function acceptedOrders(datcCase: DatcCase): Order[] {
  return datcCase.orders.flatMap(({ power, unitType, order }) => {
    const unit = datcCase.board.units.find(
      (candidate) => provinceOf(candidate.location) === provinceOf(order.unit),
    );
    if (!unit || unit.owner !== power || unit.type !== unitType) {
      return [];
    }
    return [{ ...order, unit: unit.location }];
  });
}

function runCase(datcCase: DatcCase): void {
  const { nextBoard } = resolve(datcCase.board, acceptedOrders(datcCase));
  expect(nextBoard.units.map(unitKey).sort()).toEqual(datcCase.expectedUnits.map(unitKey).sort());
  // The data file lists a dislodged unit with nowhere to retreat as destroyed, not dislodged.
  const retreating = nextBoard.dislodged.filter(
    (dislodged) => retreatOptions(nextBoard, dislodged).length > 0,
  );
  expect(retreating.map(({ unit }) => unitKey(unit)).sort()).toEqual(
    datcCase.expectedDislodged.map(unitKey).sort(),
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
      if (!SUPPORTED_PHASES.includes(datcCase.board.phaseType)) {
        test.skip(`${datcCase.title} (${datcCase.board.phaseType} phase)`, () => {});
      } else if (deviation) {
        test.fails(`${datcCase.title} (deviation: ${deviation})`, () => runCase(datcCase));
      } else {
        test(datcCase.title, () => runCase(datcCase));
      }
    }
  });
}
