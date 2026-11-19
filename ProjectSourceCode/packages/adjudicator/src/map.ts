import {
  ARMY_ADJACENCY,
  CLASSIC_PROVINCES,
  COAST_CODES,
  FLEET_ADJACENCY,
  type MapLocation,
  PROVINCE_CODES,
  type ProvinceCode,
  type UnitType,
} from '@diplomacy/game-types';

const PARENT_PROVINCE = new Map<MapLocation, ProvinceCode>(
  PROVINCE_CODES.flatMap((code) => [
    [code, code] as const,
    ...CLASSIC_PROVINCES[code].coasts.map((coast) => [coast, code] as const),
  ]),
);

const MAP_LOCATIONS: readonly string[] = [...PROVINCE_CODES, ...COAST_CODES];

export function isMapLocation(value: string): value is MapLocation {
  return MAP_LOCATIONS.includes(value);
}

export function provinceOf(location: MapLocation): ProvinceCode {
  const province = PARENT_PROVINCE.get(location);
  if (!province) {
    throw new Error(`Unknown map location: ${location}`);
  }
  return province;
}

export function isSea(province: ProvinceCode): boolean {
  return CLASSIC_PROVINCES[province].type === 'sea';
}

export function isCoastal(province: ProvinceCode): boolean {
  return CLASSIC_PROVINCES[province].type === 'coast';
}

export function fleetDestinationsIn(from: MapLocation, province: ProvinceCode): MapLocation[] {
  return FLEET_ADJACENCY[from].filter((location) => provinceOf(location) === province);
}

export function isArmyAdjacent(from: ProvinceCode, to: ProvinceCode): boolean {
  return ARMY_ADJACENCY[from].includes(to);
}

// Sea provinces reachable from `province` by a chain of seas, which is where a convoy can run.
export function seasLinkedTo(province: ProvinceCode): Set<ProvinceCode> {
  const seas = PROVINCE_CODES.filter(isSea);
  const frontier = seas.filter((sea) => canReach('fleet', sea, province));
  const linked = new Set(frontier);
  for (let sea = frontier.pop(); sea; sea = frontier.pop()) {
    for (const location of FLEET_ADJACENCY[sea]) {
      const next = provinceOf(location);
      if (isSea(next) && !linked.has(next)) {
        linked.add(next);
        frontier.push(next);
      }
    }
  }
  return linked;
}

// Whether a unit could move into `province` without a convoy; also the reach of a support order.
export function canReach(type: UnitType, from: MapLocation, province: ProvinceCode): boolean {
  if (type === 'army') {
    return isArmyAdjacent(provinceOf(from), province);
  }
  return fleetDestinationsIn(from, province).length > 0;
}
