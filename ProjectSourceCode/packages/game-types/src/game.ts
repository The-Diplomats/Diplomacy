import type { OrderAction } from './orders.js';
import type { Power } from './powers.js';
import type { MapLocation, ProvinceCode } from './provinces.js';
import type { UnitType } from './units.js';

export interface Unit {
  readonly type: UnitType;
  readonly owner: Power;
  readonly location: MapLocation;
}

export interface BoardState {
  readonly turn: number;
  readonly units: readonly Unit[];
  readonly supplyCenters: Readonly<Partial<Record<ProvinceCode, Power>>>;
}

export interface Order {
  readonly unit: ProvinceCode;
  readonly action: OrderAction;
}
