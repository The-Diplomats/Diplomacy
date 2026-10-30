import type { Power } from './powers.js';
import type { ProvinceCode, ProvinceType } from './provinces.js';

export interface ProvinceMeta {
  readonly name: string;
  readonly type: ProvinceType;
  readonly supplyCenter: boolean;
  readonly homeOf: Power | null;
}

export const CLASSIC_MAP_META: Readonly<Record<ProvinceCode, ProvinceMeta>> = {
  LON: { name: 'London', type: 'coast', supplyCenter: true, homeOf: 'england' },
  PAR: { name: 'Paris', type: 'land', supplyCenter: true, homeOf: 'france' },
  BER: { name: 'Berlin', type: 'coast', supplyCenter: true, homeOf: 'germany' },
};
