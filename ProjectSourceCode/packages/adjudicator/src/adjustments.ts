import {
  ARMY_ADJACENCY,
  type BoardState,
  CLASSIC_PROVINCES,
  FLEET_ADJACENCY,
  type MapLocation,
  type Order,
  type OrderResult,
  type Power,
  POWERS,
  PROVINCE_CODES,
  type ProvinceCode,
  type Unit,
  type UnitType,
} from '@diplomacy/game-types';

import { provinceOf } from './map.js';
import type { PhaseOutcome } from './retreats.js';

type Board = Pick<BoardState, 'units' | 'supplyCenters'>;

export function supplyCenterCount(board: Board, power: Power): number {
  return Object.values(board.supplyCenters).filter((owner) => owner === power).length;
}

// Builds owed when positive, disbands owed when negative.
export function adjustmentDelta(board: Board, power: Power): number {
  const units = board.units.filter((unit) => unit.owner === power).length;
  return supplyCenterCount(board, power) - units;
}

// Home supply centers the power still owns and that no unit occupies.
export function buildSites(board: Board, power: Power): ProvinceCode[] {
  const occupied = new Set(board.units.map((unit) => provinceOf(unit.location)));
  return PROVINCE_CODES.filter(
    (code) =>
      CLASSIC_PROVINCES[code].homeOf === power &&
      board.supplyCenters[code] === power &&
      !occupied.has(code),
  );
}

// A power has a choice to make: fewer disbands owed than it has units, or builds owed with
// somewhere to build. A power that must disband every unit has no choice.
export function mustAdjust(board: Board, power: Power): boolean {
  const delta = adjustmentDelta(board, power);
  if (delta < 0) {
    return board.units.some((unit) => unit.owner === power) && supplyCenterCount(board, power) > 0;
  }
  return delta > 0 && buildSites(board, power).length > 0;
}

function armyNeighbors(province: ProvinceCode): ProvinceCode[] {
  // For civil disorder, armies count moves through seas as if convoyed (DATC 6.J.10, 6.J.11).
  const locations = [province, ...CLASSIC_PROVINCES[province].coasts];
  const bySea = locations.flatMap((location) => FLEET_ADJACENCY[location].map(provinceOf));
  return [...ARMY_ADJACENCY[province], ...bySea];
}

// Fewest moves from the unit to any home supply center of its owner.
export function homeDistance(unit: Unit): number {
  const isHome = (province: ProvinceCode) => CLASSIC_PROVINCES[province].homeOf === unit.owner;
  if (unit.type === 'army') {
    return breadthFirstDistance(provinceOf(unit.location), armyNeighbors, isHome);
  }
  return breadthFirstDistance<MapLocation>(
    unit.location,
    (location) => FLEET_ADJACENCY[location],
    (location) => isHome(provinceOf(location)),
  );
}

function breadthFirstDistance<Node>(
  start: Node,
  neighbors: (node: Node) => readonly Node[],
  isGoal: (node: Node) => boolean,
): number {
  const seen = new Set([start]);
  let frontier = [start];
  for (let distance = 0; frontier.length > 0; distance += 1) {
    if (frontier.some(isGoal)) {
      return distance;
    }
    const next: Node[] = [];
    for (const node of frontier) {
      for (const neighbor of neighbors(node)) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  return Number.POSITIVE_INFINITY;
}

// 2000 rulebook civil disorder: farthest from home first, fleets before armies on a tie, then
// alphabetical by province name.
export function civilDisorderOrder(units: readonly Unit[]): Unit[] {
  const name = (unit: Unit) => CLASSIC_PROVINCES[provinceOf(unit.location)].name;
  return units
    .map((unit) => ({ unit, distance: homeDistance(unit) }))
    .sort(
      (first, second) =>
        second.distance - first.distance ||
        Number(second.unit.type === 'fleet') - Number(first.unit.type === 'fleet') ||
        name(first.unit).localeCompare(name(second.unit)),
    )
    .map(({ unit }) => unit);
}

function buildLocation(location: MapLocation, unitType: UnitType): MapLocation | null {
  const province = provinceOf(location);
  const meta = CLASSIC_PROVINCES[province];
  if (unitType === 'army') {
    return meta.type === 'sea' ? null : province;
  }
  if (meta.type !== 'coast') {
    return null;
  }
  if (meta.coasts.length > 0) {
    return location === province ? null : location;
  }
  return province;
}

export function resolveBuilds(board: BoardState, orders: readonly Order[]): PhaseOutcome {
  const results: Partial<Record<MapLocation, OrderResult>> = {};
  const units: Unit[] = [...board.units];
  const removed = new Set<Unit>();
  const owed = new Map(POWERS.map((power) => [power, adjustmentDelta(board, power)]));
  const taken = new Map<Power, number>();
  const occupied = new Set(board.units.map((unit) => provinceOf(unit.location)));
  const consume = (power: Power) => taken.set(power, (taken.get(power) ?? 0) + 1);

  for (const order of orders) {
    if (results[order.unit] !== undefined) {
      continue;
    }
    if (order.action === 'build') {
      const province = provinceOf(order.unit);
      const power = CLASSIC_PROVINCES[province].homeOf;
      const location = buildLocation(order.unit, order.unitType);
      const allowed =
        power !== null &&
        location !== null &&
        board.supplyCenters[province] === power &&
        !occupied.has(province) &&
        (taken.get(power) ?? 0) < (owed.get(power) ?? 0);
      if (allowed) {
        units.push({ type: order.unitType, owner: power, location });
        occupied.add(province);
        consume(power);
      }
      results[order.unit] = allowed ? 'success' : 'void';
    } else if (order.action === 'disband') {
      const province = provinceOf(order.unit);
      const unit = board.units.find(
        (candidate) => provinceOf(candidate.location) === province && !removed.has(candidate),
      );
      const allowed =
        unit !== undefined && (taken.get(unit.owner) ?? 0) < -(owed.get(unit.owner) ?? 0);
      if (allowed) {
        removed.add(unit);
        consume(unit.owner);
      }
      results[order.unit] = allowed ? 'success' : 'void';
    } else {
      results[order.unit] = 'void';
    }
  }

  for (const power of POWERS) {
    const missing = -(owed.get(power) ?? 0) - (taken.get(power) ?? 0);
    if (missing > 0) {
      const candidates = board.units.filter((unit) => unit.owner === power && !removed.has(unit));
      civilDisorderOrder(candidates)
        .slice(0, missing)
        .forEach((unit) => removed.add(unit));
    }
  }

  return { results, units: units.filter((unit) => !removed.has(unit)) };
}
