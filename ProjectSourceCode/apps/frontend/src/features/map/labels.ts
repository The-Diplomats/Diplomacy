import { COUNTRY_LABEL_NAMES } from './powers.ts';
import type { LabelData } from './types.ts';

export type LabelKind = 'country' | 'province' | 'sea' | 'skip';

const SHORT_ABBREV_RE = /^[A-Z]{2,4}\.?$/;
const SEA_WORD_RE =
  /\b(sea|ocean|channel|mediterranean|atlantic|gulf|bight|strait|skagerrak|med)\b/i;
const KNOWN_SEA_NAMES = new Set(['Helgoland', 'ENGLISHCHANNEL']);

export function classifyLabel(label: LabelData): LabelKind {
  const text = label.text.trim();
  if (COUNTRY_LABEL_NAMES.has(text.toUpperCase())) {
    return 'country';
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
