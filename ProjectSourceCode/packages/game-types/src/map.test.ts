import { describe, expect, test } from 'vitest';

import {
  ARMY_ADJACENCY,
  CLASSIC_PROVINCES,
  COAST_CODES,
  FLEET_ADJACENCY,
  type MapLocation,
  POWERS,
  PROVINCE_CODES,
  STARTING_UNITS,
} from './index.js';

const provinces = PROVINCE_CODES.map((code) => ({ code, ...CLASSIC_PROVINCES[code] }));

function provinceOf(location: MapLocation) {
  return PROVINCE_CODES.find((code) => location.startsWith(code));
}

describe('classic provinces', () => {
  test('has 75 provinces: 19 sea, 14 inland, 42 coastal', () => {
    expect(provinces).toHaveLength(75);
    expect(provinces.filter((province) => province.type === 'sea')).toHaveLength(19);
    expect(provinces.filter((province) => province.type === 'land')).toHaveLength(14);
    expect(provinces.filter((province) => province.type === 'coast')).toHaveLength(42);
  });

  test('has 34 supply centers, 22 of them home centers', () => {
    expect(provinces.filter((province) => province.supplyCenter)).toHaveLength(34);
    expect(provinces.filter((province) => province.homeOf !== null)).toHaveLength(22);
  });

  test('gives Russia 4 home centers and every other power 3', () => {
    for (const power of POWERS) {
      const homes = provinces.filter((province) => province.homeOf === power);
      expect(homes).toHaveLength(power === 'russia' ? 4 : 3);
      expect(homes.every((province) => province.supplyCenter)).toBe(true);
    }
  });

  test('lists each coast on exactly one parent province', () => {
    const listed = provinces.flatMap((province) => province.coasts);
    expect([...listed].sort()).toEqual([...COAST_CODES].sort());
  });
});

describe('adjacency', () => {
  test('army edges are symmetric and never touch the sea', () => {
    for (const code of PROVINCE_CODES) {
      for (const neighbor of ARMY_ADJACENCY[code]) {
        expect(ARMY_ADJACENCY[neighbor]).toContain(code);
        expect(CLASSIC_PROVINCES[neighbor].type).not.toBe('sea');
      }
    }
  });

  test('fleet edges are symmetric', () => {
    for (const [location, neighbors] of Object.entries(FLEET_ADJACENCY)) {
      for (const neighbor of neighbors) {
        expect(FLEET_ADJACENCY[neighbor]).toContain(location);
      }
    }
  });

  test('inland and split-coast provinces have no fleet edges', () => {
    for (const province of provinces) {
      if (province.type === 'land' || province.coasts.length > 0) {
        expect(FLEET_ADJACENCY[province.code]).toEqual([]);
      }
    }
  });
});

describe('starting units', () => {
  test('places 22 units, one on each home center of its owner', () => {
    expect(STARTING_UNITS).toHaveLength(22);
    for (const unit of STARTING_UNITS) {
      const province = provinceOf(unit.location);
      expect(province && CLASSIC_PROVINCES[province].homeOf).toBe(unit.owner);
    }
  });

  test('puts fleets only where fleets can move', () => {
    for (const unit of STARTING_UNITS.filter((unit) => unit.type === 'fleet')) {
      expect(FLEET_ADJACENCY[unit.location].length).toBeGreaterThan(0);
    }
  });
});
