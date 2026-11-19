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

const SEAS = PROVINCE_CODES.filter(isSea);

const convoyRouteSeas = new Map<string, ReadonlySet<ProvinceCode>>();

// Seas that lie on at least one convoy route from `origin` to `target` that never revisits a sea.
// Exhaustive, but the classic map needs at most a few hundred steps per pair, and results are cached.
export function seasOnConvoyRoutes(
  origin: ProvinceCode,
  target: ProvinceCode,
): ReadonlySet<ProvinceCode> {
  const key = `${origin}-${target}`;
  const cached = convoyRouteSeas.get(key);
  if (cached) {
    return cached;
  }
  const onRoute = new Set<ProvinceCode>();
  const route: ProvinceCode[] = [];
  const extend = (sea: ProvinceCode): void => {
    route.push(sea);
    if (canReach('fleet', sea, target)) {
      route.forEach((step) => onRoute.add(step));
    }
    for (const next of SEAS) {
      if (!route.includes(next) && canReach('fleet', sea, next)) {
        extend(next);
      }
    }
    route.pop();
  };
  SEAS.filter((sea) => canReach('fleet', sea, origin)).forEach(extend);
  convoyRouteSeas.set(key, onRoute);
  return onRoute;
}

// Whether a unit could move into `province` without a convoy; also the reach of a support order.
export function canReach(type: UnitType, from: MapLocation, province: ProvinceCode): boolean {
  if (type === 'army') {
    return isArmyAdjacent(provinceOf(from), province);
  }
  return fleetDestinationsIn(from, province).length > 0;
}
