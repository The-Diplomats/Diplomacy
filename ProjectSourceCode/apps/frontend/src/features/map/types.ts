export type ProvinceData = {
  id: string;
  d: string;
};

export type ImpassableData = {
  d: string;
};

export type DecorativeRegionData = {
  id: string;
  d: string;
};

export type SupplyCenterData = {
  id: string;
  x: number;
  y: number;
};

export type BorderData = {
  d: string;
  kind: 'path' | 'polyline' | 'polygon';
};

export type LabelData = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  italic?: boolean;
  bold?: boolean;
  letterSpacing?: number;
  rotation?: number;
};

export type NoisePattern = {
  href: string;
  opacity: number;
};

export type MapData = {
  width: number;
  height: number;
  provinces: ProvinceData[];
  impassables: ImpassableData[];
  decorativeRegions: DecorativeRegionData[];
  supplyCenters: SupplyCenterData[];
  borders: BorderData[];
  labels: LabelData[];
  noise?: NoisePattern;
  coastShadow?: string;
};
