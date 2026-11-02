/**
 * Stubbing with 3 provinces (London, Paris, Berlin) for now.
 * Will expand to 76 when implementing adjudicator.
 */
export const PROVINCE_CODES = ['LON', 'PAR', 'BER'] as const;
export type ProvinceCode = (typeof PROVINCE_CODES)[number];

export type ProvinceType = 'land' | 'sea' | 'coast';
