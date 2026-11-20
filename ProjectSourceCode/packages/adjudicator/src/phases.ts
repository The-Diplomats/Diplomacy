import {
  type BoardState,
  CLASSIC_PROVINCES,
  type DislodgedUnit,
  type Power,
  POWERS,
  PROVINCE_CODES,
  type ProvinceCode,
  STARTING_UNITS,
  type Unit,
} from '@diplomacy/game-types';

import { mustAdjust, resolveBuilds, supplyCenterCount } from './adjustments.js';
import { provinceOf } from './map.js';
import { retreatOptions } from './retreats.js';

export const SOLO_VICTORY_CENTERS = 18;

export interface Advance {
  readonly board: BoardState;
  readonly winner: Power | null;
}

export function initialBoard(): BoardState {
  const supplyCenters: Partial<Record<ProvinceCode, Power>> = {};
  for (const code of PROVINCE_CODES) {
    const home = CLASSIC_PROVINCES[code].homeOf;
    if (home) {
      supplyCenters[code] = home;
    }
  }
  return springMovement(1901, STARTING_UNITS, supplyCenters);
}

function springMovement(
  year: number,
  units: readonly Unit[],
  supplyCenters: BoardState['supplyCenters'],
): BoardState {
  return {
    year,
    season: 'spring',
    phaseType: 'movement',
    units,
    supplyCenters,
    dislodged: [],
    standoffs: [],
  };
}

// Dislodged units with nowhere to go are disbanded on the spot; with none left, the retreat
// phase is skipped.
export function afterMovement(
  board: BoardState,
  units: readonly Unit[],
  dislodged: readonly DislodgedUnit[],
  standoffs: readonly ProvinceCode[],
): Advance {
  const retreatBoard: BoardState = { ...board, phaseType: 'retreat', units, dislodged, standoffs };
  const retreating = dislodged.filter(
    (candidate) => retreatOptions(retreatBoard, candidate).length > 0,
  );
  if (retreating.length > 0) {
    return { board: { ...retreatBoard, dislodged: retreating }, winner: null };
  }
  return afterRetreats(board, units);
}

export function afterRetreats(board: BoardState, units: readonly Unit[]): Advance {
  if (board.season === 'spring') {
    return {
      board: { ...springMovement(board.year, units, board.supplyCenters), season: 'fall' },
      winner: null,
    };
  }
  return endOfYear(board.year, units, board.supplyCenters);
}

export function afterBuilds(board: BoardState, units: readonly Unit[]): Advance {
  return { board: springMovement(board.year + 1, units, board.supplyCenters), winner: null };
}

// Supply centers change hands once Fall's moves and retreats are done. The solo check runs here,
// before the build phase, so a skipped build phase never skips it.
function endOfYear(
  year: number,
  units: readonly Unit[],
  previous: BoardState['supplyCenters'],
): Advance {
  const supplyCenters = { ...previous };
  for (const unit of units) {
    const province = provinceOf(unit.location);
    if (CLASSIC_PROVINCES[province].supplyCenter) {
      supplyCenters[province] = unit.owner;
    }
  }
  const buildBoard: BoardState = {
    year,
    season: 'fall',
    phaseType: 'build',
    units,
    supplyCenters,
    dislodged: [],
    standoffs: [],
  };
  const winner =
    POWERS.find((power) => supplyCenterCount(buildBoard, power) >= SOLO_VICTORY_CENTERS) ?? null;
  if (POWERS.some((power) => mustAdjust(buildBoard, power))) {
    return { board: buildBoard, winner };
  }
  // Nobody has a choice: apply the forced disbands of powers left with no centers, waive the rest.
  const { units: adjusted } = resolveBuilds(buildBoard, []);
  return { board: springMovement(year + 1, adjusted, supplyCenters), winner };
}

// Powers that must act before the phase can end early.
export function affectedPowers(board: BoardState): Power[] {
  switch (board.phaseType) {
    case 'movement':
      return POWERS.filter((power) => board.units.some((unit) => unit.owner === power));
    case 'retreat':
      return POWERS.filter((power) =>
        board.dislodged.some(
          (dislodged) =>
            dislodged.unit.owner === power && retreatOptions(board, dislodged).length > 0,
        ),
      );
    case 'build':
      return POWERS.filter((power) => mustAdjust(board, power));
  }
}
