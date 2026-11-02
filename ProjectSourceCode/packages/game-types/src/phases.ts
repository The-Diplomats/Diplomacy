export const PHASE_TYPES = ['movement', 'retreat', 'build'] as const;
export type PhaseType = (typeof PHASE_TYPES)[number];
