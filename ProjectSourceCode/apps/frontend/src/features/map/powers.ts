export type Power =
  | 'england'
  | 'france'
  | 'germany'
  | 'austria'
  | 'italy'
  | 'russia'
  | 'turkey'
  | 'neutral'
  | 'water';

export const PROVINCE_OWNERS: Record<string, Power> = {
  // England
  cly: 'england',
  edi: 'england',
  lvp: 'england',
  lon: 'england',
  wal: 'england',
  yor: 'england',
  // France
  bre: 'france',
  par: 'france',
  mar: 'france',
  bur: 'france',
  pic: 'france',
  gas: 'france',
  // Germany
  ber: 'germany',
  mun: 'germany',
  kie: 'germany',
  ruh: 'germany',
  pru: 'germany',
  sil: 'germany',
  // Austria-Hungary
  vie: 'austria',
  bud: 'austria',
  tri: 'austria',
  boh: 'austria',
  gal: 'austria',
  tyr: 'austria',
  // Italy
  rom: 'italy',
  ven: 'italy',
  nap: 'italy',
  tus: 'italy',
  pie: 'italy',
  apu: 'italy',
  // Russia (incl coasts)
  mos: 'russia',
  war: 'russia',
  sev: 'russia',
  stp: 'russia',
  'stp/nc': 'russia',
  'stp/sc': 'russia',
  lvn: 'russia',
  ukr: 'russia',
  fin: 'russia',
  // Turkey
  con: 'turkey',
  ank: 'turkey',
  smy: 'turkey',
  arm: 'turkey',
  syr: 'turkey',
  // Neutral land (incl coasts)
  bel: 'neutral',
  hol: 'neutral',
  nwy: 'neutral',
  den: 'neutral',
  swe: 'neutral',
  por: 'neutral',
  spa: 'neutral',
  'spa/nc': 'neutral',
  'spa/sc': 'neutral',
  naf: 'neutral',
  tun: 'neutral',
  gre: 'neutral',
  ser: 'neutral',
  rum: 'neutral',
  bul: 'neutral',
  'bul/ec': 'neutral',
  'bul/sc': 'neutral',
  alb: 'neutral',
  // Water (19 seas)
  adr: 'water',
  aeg: 'water',
  bal: 'water',
  bar: 'water',
  bla: 'water',
  bot: 'water',
  eas: 'water',
  eng: 'water',
  gol: 'water',
  hel: 'water',
  ion: 'water',
  iri: 'water',
  mid: 'water',
  nat: 'water',
  nrg: 'water',
  nth: 'water',
  ska: 'water',
  tys: 'water',
  wes: 'water',
};

export const POWER_COLORS: Record<Power, { fill: string; stroke: string }> = {
  england: { fill: '#536988', stroke: '#000000' }, // lighter slate blue (mountains will darken)
  france: { fill: '#7a9388', stroke: '#000000' }, // sage-teal
  germany: { fill: '#403e30', stroke: '#000000' }, // dark olive-brown
  austria: { fill: '#ac525b', stroke: '#000000' }, // rich antique red with slight dust
  italy: { fill: '#6e7f54', stroke: '#000000' }, // olive green
  russia: { fill: '#fcf9ee', stroke: '#000000' }, // whiter parchment
  turkey: { fill: '#dab35a', stroke: '#000000' }, // brighter gold (mountain shading will warm it)
  neutral: { fill: '#e5baa0', stroke: '#000000' }, // lighter pinkish-peach terracotta
  water: { fill: '#afc1cf', stroke: '#000000' }, // pale silver-blue
};

export const BOARD_COLORS = {
  background: '#e8ddc0', // warm aged cream
  frame: '#b8974c', // antique gold
};

export const COUNTRY_LABEL_NAMES = new Set([
  'ENGLAND',
  'FRANCE',
  'GERMANY',
  'AUSTRIA-HUNGARY',
  'ITALY',
  'RUSSIA',
  'TURKEY',
]);

// Hand-tuned centers of each power's home territory for country name overlays.
// Godip's SVG doesn't include country labels; we synthesize them.
// Positions + per-country sizing so labels fit INSIDE each country's shape.
export const COUNTRY_LABEL_POSITIONS: Record<
  Exclude<Power, 'neutral' | 'water'>,
  { x: number; y: number; fontSize: number; letterSpacing: number }
> = {
  england: { x: 390, y: 665, fontSize: 14, letterSpacing: 2 }, // vertically between yor and wal, within land
  france: { x: 440, y: 1000, fontSize: 22, letterSpacing: 3 },
  germany: { x: 790, y: 840, fontSize: 22, letterSpacing: 3 },
  austria: { x: 1030, y: 1030, fontSize: 22, letterSpacing: 3 }, // AUSTRIA-HUNGARY is long
  italy: { x: 770, y: 1250, fontSize: 18, letterSpacing: 2 }, // narrow boot
  russia: { x: 1280, y: 700, fontSize: 34, letterSpacing: 6 }, // huge country
  turkey: { x: 1360, y: 1200, fontSize: 22, letterSpacing: 3 },
};

// Pretty-printed country labels for render overlay
export const COUNTRY_LABEL_TEXT: Record<Exclude<Power, 'neutral' | 'water'>, string> = {
  england: 'ENGLAND',
  france: 'FRANCE',
  germany: 'GERMANY',
  austria: 'AUSTRIA-HUNGARY',
  italy: 'ITALY',
  russia: 'RUSSIA',
  turkey: 'TURKEY',
};

export function getProvinceOwner(id: string): Power {
  return PROVINCE_OWNERS[id] ?? 'neutral';
}

// Hand-authored label positions for provinces, overriding godip's rotated positions so each
// label sits horizontally inside the province shape. Keyed by province id. Grow this map as we
// lock down each country. Coordinates are godip viewBox units.
export const PROVINCE_LABEL_OVERRIDES: Record<string, { x: number; y: number }> = {
  // England
  cly: { x: 360, y: 490 },
  edi: { x: 420, y: 520 },
  lvp: { x: 365, y: 610 },
  yor: { x: 445, y: 640 },
  wal: { x: 345, y: 690 },
  lon: { x: 405, y: 720 },
};

const PROVINCE_LABEL_TEXT_TO_ID: Record<string, string> = {
  CLYDE: 'cly',
  EDINBURGH: 'edi',
  LIVERPOOL: 'lvp',
  YORKSHIRE: 'yor',
  WALES: 'wal',
  LONDON: 'lon',
};

export function provinceIdFromLabel(text: string): string | undefined {
  return PROVINCE_LABEL_TEXT_TO_ID[text.toUpperCase()];
}
