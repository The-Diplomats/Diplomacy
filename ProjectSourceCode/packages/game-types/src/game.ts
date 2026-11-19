import type { PhaseType } from './phases.js';
import type { Power } from './powers.js';
import type { MapLocation, ProvinceCode } from './provinces.js';
import type { Season } from './seasons.js';
import type { UnitType } from './units.js';

export interface Unit {
  readonly type: UnitType;
  readonly owner: Power;
  readonly location: MapLocation;
}

export interface DislodgedUnit {
  readonly unit: Unit;
  // Null when the attacker arrived by convoy, which leaves its origin open as a retreat.
  readonly attackerFrom: ProvinceCode | null;
}

export interface BoardState {
  readonly year: number;
  readonly season: Season;
  readonly phaseType: PhaseType;
  readonly units: readonly Unit[];
  readonly supplyCenters: Readonly<Partial<Record<ProvinceCode, Power>>>;
  // Set only during a retreat phase.
  readonly dislodged: readonly DislodgedUnit[];
  // Provinces left empty by a standoff in the preceding movement phase; no unit may retreat there.
  readonly standoffs: readonly ProvinceCode[];
}
