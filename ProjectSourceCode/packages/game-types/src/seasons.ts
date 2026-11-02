export const SEASONS = ['spring', 'fall'] as const;
export type Season = (typeof SEASONS)[number];
