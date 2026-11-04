import { COUNTRY_LABEL_NAMES } from './powers.ts';
import type { LabelData } from './types.ts';

export type LabelKind = 'country' | 'province' | 'sea' | 'skip';

const SHORT_ABBREV_RE = /^[A-Z]{2,4}\.?$/;
const COAST_ABBREV_RE = /^(SC|NC|EC|WC)$/i;

const COAST_EXPANSIONS: Record<string, string> = {
  SC: 'South Coast',
  NC: 'North Coast',
  EC: 'East Coast',
  WC: 'West Coast',
};

export function isCoastLabel(text: string): boolean {
  return COAST_ABBREV_RE.test(text.trim());
}

export function expandCoastLabel(text: string): string {
  return COAST_EXPANSIONS[text.trim().toUpperCase()] ?? text;
}

// Hand-authored nudges for specific coast labels. Keyed by text + approximate godip x so we can
// distinguish e.g. Spain's NC from St Petersburg's NC. Keeps the godip rotation intact; only
// shifts the position.
const COAST_LABEL_NUDGES: Array<{ text: string; nearX: number; dx: number; dy: number }> = [
  { text: 'NC', nearX: 558, dx: 25, dy: -2 }, // Spain North Coast — shift right + up
  { text: 'EC', nearX: -416, dx: -16, dy: -1 }, // Bulgaria East Coast — visual: ~8 left + ~13 down (rotation -62°)
  { text: 'SC', nearX: 877, dx: -3, dy: -2 }, // Bulgaria South Coast — ~2 up + 3 left (rotation -6°)
  { text: 'SC', nearX: 997, dx: 5, dy: -9 }, // St Petersburg South Coast — right + up
  { text: 'NC', nearX: 1114, dx: -62, dy: 72 }, // St Petersburg North Coast — left + down
];

// Province name expansions: godip ships abbreviated prefixes like "N. Africa"; Deluxe spells
// them out.
const PROVINCE_NAME_EXPANSIONS: Array<[RegExp, string]> = [
  [/^N\. /, 'North '],
  [/^S\. /, 'South '],
  [/^E\. /, 'East '],
  [/^W\. /, 'West '],
];

export function expandProvinceName(text: string): string {
  for (const [re, replacement] of PROVINCE_NAME_EXPANSIONS) {
    if (re.test(text)) {
      return text.replace(re, replacement);
    }
  }
  return text;
}

export function coastLabelNudge(text: string, x: number): { dx: number; dy: number } {
  const t = text.trim().toUpperCase();
  for (const n of COAST_LABEL_NUDGES) {
    if (n.text === t && Math.abs(x - n.nearX) < 50) {
      return { dx: n.dx, dy: n.dy };
    }
  }
  return { dx: 0, dy: 0 };
}
const SEA_WORD_RE =
  /\b(sea|ocean|channel|mediterranean|atlantic|gulf|bight|strait|skagerrak|med)\b/i;
const KNOWN_SEA_NAMES = new Set(['Helgoland', 'ENGLISHCHANNEL']);

export function classifyLabel(label: LabelData): LabelKind {
  const text = label.text.trim();
  if (COUNTRY_LABEL_NAMES.has(text.toUpperCase())) {
    return 'country';
  }
  // Coast abbreviations (SC, NC, EC, WC) are real labels — keep them even though they match
  // the generic short-abbrev pattern.
  if (COAST_ABBREV_RE.test(text)) {
    return 'province';
  }
  if (SHORT_ABBREV_RE.test(text)) {
    return 'skip';
  }
  if (SEA_WORD_RE.test(text) || KNOWN_SEA_NAMES.has(text)) {
    return 'sea';
  }
  return 'province';
}

// Godip ships sea names in ALL CAPS and some joined (ENGLISHCHANNEL). Deluxe shows sea labels
// in Title Case with real word boundaries.
const SEA_TEXT_FIXUPS: Record<string, string> = {
  ENGLISHCHANNEL: 'English Channel',
  'EAST MED': 'Eastern Mediterranean',
  'N. ATLANTIC': 'North Atlantic Ocean',
};

export function prettifySeaText(text: string): string {
  const fix = SEA_TEXT_FIXUPS[text.toUpperCase()];
  if (fix) {
    return fix;
  }
  if (text === text.toUpperCase()) {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return text;
}
