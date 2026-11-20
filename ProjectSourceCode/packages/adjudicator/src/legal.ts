import {
  ARMY_ADJACENCY,
  type BoardState,
  CLASSIC_PROVINCES,
  FLEET_ADJACENCY,
  type Order,
  type Power,
  PROVINCE_CODES,
  type ProvinceCode,
  type Unit,
} from '@diplomacy/game-types';

import { adjustmentDelta, buildLocation, buildSites, civilDisorderOrder } from './adjustments.js';
import {
  canReach,
  isArmyAdjacent,
  isCoastal,
  isSea,
  provinceOf,
  seasOnConvoyRoutes,
} from './map.js';
import { convoyRouteFleets, convoyRoutePossible, moveDestination } from './movement.js';
import { retreatOptions, retreatTarget } from './retreats.js';

export type OrderCheck =
  { readonly legal: true } | { readonly legal: false; readonly reason: string };

export interface OrderProblem {
  // Position of the offending order in the submitted list.
  readonly index: number;
  readonly reason: string;
}

const LEGAL: OrderCheck = { legal: true };

function illegal(reason: string): OrderCheck {
  return { legal: false, reason };
}

function unitIn(units: readonly Unit[], province: ProvinceCode): Unit | undefined {
  return units.find((unit) => provinceOf(unit.location) === province);
}

// Adjacency for the unit's type, or for an army a convoy the fleets at sea could carry.
function couldMoveTo(board: BoardState, unit: Unit, province: ProvinceCode): boolean {
  const from = provinceOf(unit.location);
  if (from === province) {
    return false;
  }
  if (canReach(unit.type, unit.location, province)) {
    return true;
  }
  return (
    unit.type === 'army' &&
    isCoastal(from) &&
    isCoastal(province) &&
    convoyRoutePossible(board.units, from, province)
  );
}

function checkMovementOrder(board: BoardState, unit: Unit, order: Order): OrderCheck {
  const province = provinceOf(unit.location);
  switch (order.action) {
    case 'hold':
      return LEGAL;
    case 'move': {
      if (order.viaConvoy && unit.type !== 'army') {
        return illegal('Only armies can be convoyed');
      }
      const to = moveDestination(unit, province, order.to);
      if (!to) {
        return illegal(`The ${unit.type} in ${unit.location} cannot move to ${order.to}`);
      }
      const target = provinceOf(to);
      if (
        unit.type === 'army' &&
        !isArmyAdjacent(province, target) &&
        !convoyRoutePossible(board.units, province, target)
      ) {
        return illegal(`No fleets at sea could convoy the army in ${province} to ${target}`);
      }
      return LEGAL;
    }
    case 'support': {
      const { supported, to } = order;
      if (supported === province) {
        return illegal('A unit cannot support itself');
      }
      const supportedUnit = unitIn(board.units, supported);
      if (!supportedUnit) {
        return illegal(`There is no unit in ${supported} to support`);
      }
      if (to === undefined) {
        return canReach(unit.type, unit.location, supported)
          ? LEGAL
          : illegal(`The ${unit.type} in ${unit.location} cannot reach ${supported}`);
      }
      if (to === supported) {
        return illegal('A supported move must leave its province');
      }
      if (!canReach(unit.type, unit.location, to)) {
        return illegal(`The ${unit.type} in ${unit.location} cannot reach ${to}`);
      }
      if (!couldMoveTo(board, supportedUnit, to)) {
        return illegal(`The unit in ${supported} cannot move to ${to}`);
      }
      return LEGAL;
    }
    case 'convoy': {
      if (unit.type !== 'fleet' || !isSea(province)) {
        return illegal('Only a fleet at sea can convoy');
      }
      const army = unitIn(board.units, order.army);
      if (army?.type !== 'army') {
        return illegal(`There is no army in ${order.army} to convoy`);
      }
      if (order.army === order.to || !isCoastal(order.army) || !isCoastal(order.to)) {
        return illegal(`An army cannot be convoyed from ${order.army} to ${order.to}`);
      }
      // The fleet must sit on a sea route that never doubles back, and either be in a chain of
      // fleets at sea reaching both ends, or be the army's own fleet while such a chain exists:
      // that order is how a power signals its army goes by convoy (DATC 6.G.6).
      const carriers = convoyRouteFleets(board.units, order.army, order.to);
      const onRoute =
        seasOnConvoyRoutes(order.army, order.to).has(province) &&
        (carriers.includes(unit) || (army.owner === unit.owner && carriers.length > 0));
      return onRoute
        ? LEGAL
        : illegal(`${province} is not on a convoy route from ${order.army} to ${order.to}`);
    }
    default:
      return illegal(`${order.action} orders are not allowed in a movement phase`);
  }
}

function checkRetreatOrder(board: BoardState, power: Power, order: Order): OrderCheck {
  const dislodged = board.dislodged.find(({ unit }) => unit.location === order.unit);
  if (!dislodged) {
    return illegal(`There is no dislodged unit at ${order.unit}`);
  }
  if (dislodged.unit.owner !== power) {
    return illegal(`The unit at ${order.unit} belongs to ${dislodged.unit.owner}`);
  }
  switch (order.action) {
    case 'disband':
      return LEGAL;
    case 'retreat':
      return retreatTarget(dislodged.unit, retreatOptions(board, dislodged), order.to)
        ? LEGAL
        : illegal(`The unit at ${order.unit} cannot retreat to ${order.to}`);
    default:
      return illegal(`${order.action} orders are not allowed in a retreat phase`);
  }
}

function checkBuildPhaseOrder(board: BoardState, power: Power, order: Order): OrderCheck {
  const delta = adjustmentDelta(board, power);
  switch (order.action) {
    case 'build': {
      const province = provinceOf(order.unit);
      if (delta <= 0) {
        return illegal(`${power} has no builds owed`);
      }
      if (CLASSIC_PROVINCES[province].homeOf !== power) {
        return illegal(`${province} is not a home supply center of ${power}`);
      }
      if (!buildSites(board, power).includes(province)) {
        return illegal(`${province} is occupied or no longer owned by ${power}`);
      }
      return buildLocation(order.unit, order.unitType)
        ? LEGAL
        : illegal(`A ${order.unitType} cannot be built at ${order.unit}`);
    }
    case 'disband': {
      const unit = board.units.find((candidate) => candidate.location === order.unit);
      if (unit?.owner !== power) {
        return illegal(`${power} has no unit at ${order.unit}`);
      }
      return delta < 0 ? LEGAL : illegal(`${power} has no disbands owed`);
    }
    default:
      return illegal(`${order.action} orders are not allowed in a build phase`);
  }
}

// Whether `power` may submit `order` in this phase. Matches what the adjudicator carries out:
// an order that passes is never treated as void for being impossible, only for being unmatched.
export function validateOrder(board: BoardState, power: Power, order: Order): OrderCheck {
  switch (board.phaseType) {
    case 'movement': {
      const unit = board.units.find((candidate) => candidate.location === order.unit);
      if (!unit) {
        return illegal(`There is no unit at ${order.unit}`);
      }
      if (unit.owner !== power) {
        return illegal(`The unit at ${order.unit} belongs to ${unit.owner}`);
      }
      return checkMovementOrder(board, unit, order);
    }
    case 'retreat':
      return checkRetreatOrder(board, power, order);
    case 'build':
      return checkBuildPhaseOrder(board, power, order);
  }
}

// Checks a power's full order set: each order, one order per unit or build site, and in a build
// phase no more builds or disbands than owed.
export function validateOrders(
  board: BoardState,
  power: Power,
  orders: readonly Order[],
): OrderProblem[] {
  const problems: OrderProblem[] = [];
  const covered = new Set<ProvinceCode>();
  const delta = board.phaseType === 'build' ? adjustmentDelta(board, power) : 0;
  let builds = 0;
  let disbands = 0;
  orders.forEach((order, index) => {
    const check = validateOrder(board, power, order);
    if (!check.legal) {
      problems.push({ index, reason: check.reason });
      return;
    }
    const province = provinceOf(order.unit);
    if (covered.has(province)) {
      problems.push({ index, reason: `Another order already covers ${province}` });
      return;
    }
    covered.add(province);
    if (board.phaseType !== 'build') {
      return;
    }
    if (order.action === 'build' && ++builds > delta) {
      problems.push({ index, reason: `${power} is owed only ${delta} build(s)` });
    }
    if (order.action === 'disband' && ++disbands > -delta) {
      problems.push({ index, reason: `${power} owes only ${-delta} disband(s)` });
    }
  });
  return problems;
}

function movementCandidates(board: BoardState, unit: Unit): Order[] {
  const location = unit.location;
  const province = provinceOf(location);
  const reachable = [
    ...new Set(
      unit.type === 'army' ? ARMY_ADJACENCY[province] : FLEET_ADJACENCY[location].map(provinceOf),
    ),
  ];
  const destinations =
    unit.type === 'army'
      ? PROVINCE_CODES.filter((code) => !isSea(code))
      : FLEET_ADJACENCY[location];
  const others = board.units.filter((other) => other !== unit);
  const supports = reachable.flatMap((target): Order[] => [
    ...(unitIn(others, target)
      ? [{ action: 'support' as const, unit: location, supported: target }]
      : []),
    ...others
      .filter((other) => provinceOf(other.location) !== target)
      .map((other) => ({
        action: 'support' as const,
        unit: location,
        supported: provinceOf(other.location),
        to: target,
      })),
  ]);
  const convoys = isSea(province)
    ? others
        .filter((other) => other.type === 'army')
        .flatMap((army) =>
          PROVINCE_CODES.filter(isCoastal).map((to) => ({
            action: 'convoy' as const,
            unit: location,
            army: provinceOf(army.location),
            to,
          })),
        )
    : [];
  // Next door, an army goes over land unless told to take a convoy fleets at sea could provide.
  const convoyedNextDoor =
    unit.type === 'army'
      ? ARMY_ADJACENCY[province]
          .filter((to) => convoyRoutePossible(board.units, province, to))
          .map((to) => ({ action: 'move' as const, unit: location, to, viaConvoy: true }))
      : [];
  return [
    { action: 'hold', unit: location },
    ...destinations.map((to) => ({ action: 'move' as const, unit: location, to })),
    ...convoyedNextDoor,
    ...supports,
    ...convoys,
  ];
}

function buildPhaseCandidates(board: BoardState, power: Power): Order[] {
  const delta = adjustmentDelta(board, power);
  if (delta < 0) {
    return board.units
      .filter((unit) => unit.owner === power)
      .map((unit) => ({ action: 'disband', unit: unit.location }));
  }
  if (delta === 0) {
    return [];
  }
  return buildSites(board, power).flatMap((site): Order[] => {
    const coasts = CLASSIC_PROVINCES[site].coasts;
    const fleetSites = coasts.length > 0 ? coasts : [site];
    return [
      { action: 'build', unit: site, unitType: 'army' },
      ...fleetSites.map((unit) => ({ action: 'build' as const, unit, unitType: 'fleet' as const })),
    ];
  });
}

// Every order `power` may give this phase, as one flat list; consumers group it by `unit`.
export function legalOrders(board: BoardState, power: Power): Order[] {
  const candidates = ((): Order[] => {
    switch (board.phaseType) {
      case 'movement':
        return board.units
          .filter((unit) => unit.owner === power)
          .flatMap((unit) => movementCandidates(board, unit));
      case 'retreat':
        return board.dislodged
          .filter(({ unit }) => unit.owner === power)
          .flatMap((dislodged): Order[] => [
            ...retreatOptions(board, dislodged).map((to) => ({
              action: 'retreat' as const,
              unit: dislodged.unit.location,
              to,
            })),
            { action: 'disband', unit: dislodged.unit.location },
          ]);
      case 'build':
        return buildPhaseCandidates(board, power);
    }
  })();
  return candidates.filter((order) => validateOrder(board, power, order).legal);
}

// Orders that stand in for what `power` didn't submit: hold in movement, disband in retreat,
// and in a build phase the civil-disorder disbands still owed. Unused builds are simply waived.
export function defaultOrders(
  board: BoardState,
  power: Power,
  submitted: readonly Order[] = [],
): Order[] {
  const covered = new Set(submitted.map((order) => provinceOf(order.unit)));
  switch (board.phaseType) {
    case 'movement':
      return board.units
        .filter((unit) => unit.owner === power && !covered.has(provinceOf(unit.location)))
        .map((unit) => ({ action: 'hold', unit: unit.location }));
    case 'retreat':
      return board.dislodged
        .filter(({ unit }) => unit.owner === power && !covered.has(provinceOf(unit.location)))
        .map(({ unit }) => ({ action: 'disband', unit: unit.location }));
    case 'build': {
      const owed = -adjustmentDelta(board, power);
      const ordered = submitted.filter(
        (order) => order.action === 'disband' && validateOrder(board, power, order).legal,
      ).length;
      const remaining = board.units.filter(
        (unit) => unit.owner === power && !covered.has(provinceOf(unit.location)),
      );
      return civilDisorderOrder(remaining)
        .slice(0, Math.max(0, owed - ordered))
        .map((unit) => ({ action: 'disband', unit: unit.location }));
    }
  }
}
