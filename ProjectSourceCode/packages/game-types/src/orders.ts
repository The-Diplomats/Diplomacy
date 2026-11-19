import type { MapLocation, ProvinceCode } from './provinces.js';
import type { UnitType } from './units.js';

export const ORDER_ACTIONS = [
  'hold',
  'move',
  'support',
  'convoy',
  'retreat',
  'build',
  'disband',
] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

// NULL in the DB means not yet adjudicated; dislodgement is reported per unit, not per order.
export const ORDER_RESULTS = ['success', 'bounced', 'cut', 'void', 'disbanded'] as const;
export type OrderResult = (typeof ORDER_RESULTS)[number];

export interface HoldOrder {
  readonly action: 'hold';
  readonly unit: MapLocation;
}

export interface MoveOrder {
  readonly action: 'move';
  readonly unit: MapLocation;
  readonly to: MapLocation;
  readonly viaConvoy?: boolean;
}

// Without `to`, the order supports the unit in `supported` to hold.
export interface SupportOrder {
  readonly action: 'support';
  readonly unit: MapLocation;
  readonly supported: ProvinceCode;
  readonly to?: ProvinceCode;
}

export interface ConvoyOrder {
  readonly action: 'convoy';
  readonly unit: MapLocation;
  readonly army: ProvinceCode;
  readonly to: ProvinceCode;
}

export interface RetreatOrder {
  readonly action: 'retreat';
  readonly unit: MapLocation;
  readonly to: MapLocation;
}

export interface DisbandOrder {
  readonly action: 'disband';
  readonly unit: MapLocation;
}

// `unit` is where the new unit is placed. Builds a power leaves unused are waived.
export interface BuildOrder {
  readonly action: 'build';
  readonly unit: MapLocation;
  readonly unitType: UnitType;
}

export type MovementOrder = HoldOrder | MoveOrder | SupportOrder | ConvoyOrder;
export type RetreatPhaseOrder = RetreatOrder | DisbandOrder;
export type BuildPhaseOrder = BuildOrder | DisbandOrder;

export type Order = MovementOrder | RetreatPhaseOrder | BuildPhaseOrder;
