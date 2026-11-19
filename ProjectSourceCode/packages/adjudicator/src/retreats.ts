import {
  ARMY_ADJACENCY,
  type BoardState,
  type DislodgedUnit,
  FLEET_ADJACENCY,
  type MapLocation,
} from '@diplomacy/game-types';

import { provinceOf } from './map.js';

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
