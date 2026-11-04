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
  { x: number; y: number; fontSize: number; letterSpacing: number; haloScale?: number }
> = {
  england: { x: 390, y: 665, fontSize: 14, letterSpacing: 2 }, // vertically between yor and wal, within land
  france: { x: 445, y: 888, fontSize: 14, letterSpacing: 2, haloScale: 1.6 },
  germany: { x: 662, y: 760, fontSize: 14, letterSpacing: 2, haloScale: 1.6 },
  austria: { x: 840, y: 945, fontSize: 14, letterSpacing: 2, haloScale: 1.6 },
  italy: { x: 647, y: 1025, fontSize: 14, letterSpacing: 2 },
  russia: { x: 1180, y: 645, fontSize: 14, letterSpacing: 2, haloScale: 2.4 },
  turkey: { x: 1430, y: 1165, fontSize: 14, letterSpacing: 2, haloScale: 2.4 },
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
  // France
  bre: { x: 355, y: 842 },
  par: { x: 430, y: 862 },
  mar: { x: 464, y: 1005 },
  bur: { x: 495, y: 920 },
  pic: { x: 455, y: 802 },
  gas: { x: 378, y: 960 },
  // Germany
  ber: { x: 700, y: 721 },
  mun: { x: 645, y: 845 },
  kie: { x: 629, y: 706 },
  ruh: { x: 580, y: 800 },
  pru: { x: 815, y: 690 },
  sil: { x: 756, y: 767 },
  // Austria-Hungary
  vie: { x: 796, y: 898 },
  bud: { x: 916, y: 912 },
  tri: { x: 806, y: 1026 },
  boh: { x: 735, y: 836 },
  gal: { x: 938, y: 828 },
  tyr: { x: 700, y: 920 },
  // Italy
  rom: { x: 693, y: 1105 },
  ven: { x: 655, y: 995 },
  nap: { x: 762, y: 1162 },
  tus: { x: 650, y: 1055 },
  pie: { x: 588, y: 978 },
  apu: { x: 753, y: 1115 },
  // Russia
  mos: { x: 1250, y: 535 },
  war: { x: 920, y: 722 },
  sev: { x: 1400, y: 770 },
  stp: { x: 1150, y: 351 },
  lvn: { x: 955, y: 583 },
  ukr: { x: 1130, y: 785 },
  fin: { x: 943, y: 365 },
  // Turkey
  con: { x: 1125, y: 1155 },
  ank: { x: 1258, y: 1110 },
  smy: { x: 1230, y: 1208 },
  arm: { x: 1430, y: 1105 },
  syr: { x: 1440, y: 1255 },
  // Neutrals
  bel: { x: 515, y: 773 },
  hol: { x: 537, y: 729 },
  nwy: { x: 645, y: 395 },
  den: { x: 644, y: 597 },
  swe: { x: 754, y: 462 },
  por: { x: 129, y: 1055 },
  spa: { x: 246, y: 1100 },
  naf: { x: 278, y: 1320 },
  tun: { x: 585, y: 1320 },
  gre: { x: 925, y: 1180 },
  ser: { x: 906, y: 1052 },
  rum: { x: 1014, y: 992 },
  bul: { x: 1005, y: 1070 },
  alb: { x: 873, y: 1145 },
};

const PROVINCE_LABEL_TEXT_TO_ID: Record<string, string> = {
  CLYDE: 'cly',
  EDINBURGH: 'edi',
  LIVERPOOL: 'lvp',
  YORKSHIRE: 'yor',
  WALES: 'wal',
  LONDON: 'lon',
  BREST: 'bre',
  PARIS: 'par',
  MARSEILLES: 'mar',
  BURGUNDY: 'bur',
  PICARDY: 'pic',
  GASCONY: 'gas',
  BERLIN: 'ber',
  MUNICH: 'mun',
  KIEL: 'kie',
  RUHR: 'ruh',
  PRUSSIA: 'pru',
  SILESIA: 'sil',
  VIENNA: 'vie',
  BUDAPEST: 'bud',
  TRIESTE: 'tri',
  BOHEMIA: 'boh',
  GALICIA: 'gal',
  TYROLIA: 'tyr',
  ROME: 'rom',
  VENICE: 'ven',
  NAPLES: 'nap',
  TUSCANY: 'tus',
  PIEDMONT: 'pie',
  APULIA: 'apu',
  MOSCOW: 'mos',
  WARSAW: 'war',
  SEVASTOPOL: 'sev',
  'ST. PETERSBURG': 'stp',
  LIVONIA: 'lvn',
  UKRAINE: 'ukr',
  FINLAND: 'fin',
  CONSTANTINOPLE: 'con',
  ANKARA: 'ank',
  SMYRNA: 'smy',
  ARMENIA: 'arm',
  SYRIA: 'syr',
  BELGIUM: 'bel',
  HOLLAND: 'hol',
  NORWAY: 'nwy',
  DENMARK: 'den',
  SWEDEN: 'swe',
  PORTUGAL: 'por',
  SPAIN: 'spa',
  'NORTH AFRICA': 'naf',
  'N.AFRICA': 'naf',
  'N. AFRICA': 'naf',
  TUNIS: 'tun',
  GREECE: 'gre',
  SERBIA: 'ser',
  RUMANIA: 'rum',
  BULGARIA: 'bul',
  ALBANIA: 'alb',
};

export function provinceIdFromLabel(text: string): string | undefined {
  return PROVINCE_LABEL_TEXT_TO_ID[text.toUpperCase()];
}

// Hand-authored sea label positions. Keyed by the godip label text (uppercased). If present we
// use these coords (and optional rotation) instead of godip's; otherwise godip's defaults stand.
// Set rotation to 0 to force horizontal.
export type SeaLabelOverride = { x: number; y: number; rotation?: number; fontSize?: number };

// Positions are godip's rotated-visible world coordinates (computed from label.x/y + rotation).
// Non-rotated godip labels use godip's x/y directly.
export const SEA_LABEL_OVERRIDES: Record<string, SeaLabelOverride> = {
  'WEST MEDITERRANEAN': { x: 365, y: 1219 },
  'GULF OF LYON': { x: 453, y: 1103 },
  'MID ATLANTIC': { x: 33, y: 863 },
  'TYRRHENIAN SEA': { x: 624, y: 1191 },
  'ADRIATIC SEA': { x: 705, y: 1019 },
  'IONIAN SEA': { x: 781, y: 1323 },
  'AEGEAN SEA': { x: 1015, y: 1180 },
  'EAST MED': { x: 1180, y: 1308 },
  'BLACK SEA': { x: 1225, y: 998 },
  'BALTIC SEA': { x: 775, y: 615 },
  'BARENTS SEA': { x: 944, y: 40 },
  'GULF OF BOTHNIA': { x: 852, y: 473 },
  HELGOLAND: { x: 545, y: 647 },
  BIGHT: { x: 562, y: 659 },
  'IRISH SEA': { x: 232, y: 700 },
  ENGLISHCHANNEL: { x: 308, y: 767 },
  'NORTH SEA': { x: 475, y: 578 },
  'N. ATLANTIC': { x: 71, y: 436 },
  'NORWEGIAN SEA': { x: 513, y: 220 },
};

export function seaLabelOverride(text: string): SeaLabelOverride | undefined {
  return SEA_LABEL_OVERRIDES[text.toUpperCase().trim()];
}
