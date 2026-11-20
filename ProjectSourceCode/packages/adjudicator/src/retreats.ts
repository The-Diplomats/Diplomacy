import {
  ARMY_ADJACENCY,
  type BoardState,
  type DislodgedUnit,
  FLEET_ADJACENCY,
  type MapLocation,
  type Order,
  type OrderResult,
  type ProvinceCode,
  type Unit,
} from '@diplomacy/game-types';

import { provinceOf } from './map.js';

export interface PhaseOutcome {
  readonly results: Partial<Record<MapLocation, OrderResult>>;
  readonly units: readonly Unit[];
}

// Where a dislodged unit may retreat: an adjacent location that is unoccupied, wasn't left
// empty by a standoff, and isn't the province its attacker came from.
export function retreatOptions(
  board: Pick<BoardState, 'units' | 'standoffs'>,
  { unit, attackerFrom }: DislodgedUnit,
): MapLocation[] {
  const occupied = new Set(board.units.map((other) => provinceOf(other.location)));
  const neighbors: readonly MapLocation[] =
    unit.type === 'army'
      ? ARMY_ADJACENCY[provinceOf(unit.location)]
      : FLEET_ADJACENCY[unit.location];
  return neighbors.filter((location) => {
    const province = provinceOf(location);
    return (
      !occupied.has(province) && province !== attackerFrom && !board.standoffs.includes(province)
    );
  });
}

// An army ignores any coast it names. For a fleet, a split-coast province named without a coast
// resolves only when one coast is an option.
export function retreatTarget(
  unit: Unit,
  options: readonly MapLocation[],
  destination: MapLocation,
): MapLocation | null {
  const to = unit.type === 'army' ? provinceOf(destination) : destination;
  if (options.includes(to)) {
    return to;
  }
  const inProvince = options.filter((option) => provinceOf(option) === to);
  const [onlyCoast] = inProvince;
  return inProvince.length === 1 && onlyCoast ? onlyCoast : null;
}

// Every dislodged unit without a valid retreat is disbanded, and so is every unit that retreats
// into the same province as another.
export function resolveRetreats(board: BoardState, orders: readonly Order[]): PhaseOutcome {
  const ordersByProvince = new Map<ProvinceCode, Order>();
  for (const order of orders) {
    const province = provinceOf(order.unit);
    if (!ordersByProvince.has(province)) {
      ordersByProvince.set(province, order);
    }
  }

  const plans = board.dislodged.map((dislodged) => {
    const order = ordersByProvince.get(provinceOf(dislodged.unit.location));
    const target =
      order?.action === 'retreat'
        ? retreatTarget(dislodged.unit, retreatOptions(board, dislodged), order.to)
        : null;
    return { unit: dislodged.unit, order, target };
  });

  const arrivals = new Map<ProvinceCode, number>();
  for (const { target } of plans) {
    if (target) {
      const province = provinceOf(target);
      arrivals.set(province, (arrivals.get(province) ?? 0) + 1);
    }
  }

  const results: Partial<Record<MapLocation, OrderResult>> = {};
  const retreated: Unit[] = [];
  for (const { unit, order, target } of plans) {
    const clash = target !== null && (arrivals.get(provinceOf(target)) ?? 0) > 1;
    if (target && !clash) {
      retreated.push({ ...unit, location: target });
    }
    if (!order) {
      continue;
    }
    if (order.action === 'disband') {
      results[order.unit] = 'success';
    } else if (!target) {
      results[order.unit] = 'void';
    } else {
      results[order.unit] = clash ? 'disbanded' : 'success';
    }
  }

  return { results, units: [...board.units, ...retreated] };
}
