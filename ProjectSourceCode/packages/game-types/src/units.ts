export const UNIT_TYPES = ['army', 'fleet'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];
