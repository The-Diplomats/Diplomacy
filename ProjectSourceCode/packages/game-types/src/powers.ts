export const POWERS = [
  'austria',
  'england',
  'france',
  'germany',
  'italy',
  'russia',
  'turkey',
] as const;
export type Power = (typeof POWERS)[number];
