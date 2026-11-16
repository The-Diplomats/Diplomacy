export const ORDER_ACTIONS = [
  'hold',
  'move',
  'support',
  'convoy',
  'retreat',
  'build',
  'disband',
  'waive',
] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

export const ORDER_RESULTS = [
  'pending',
  'success',
  'bounced',
  'cut',
  'dislodged',
  'disbanded',
] as const;
export type OrderResult = (typeof ORDER_RESULTS)[number];
