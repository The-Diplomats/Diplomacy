import type { BoardState, MapLocation, Order, OrderResult, Power } from '@diplomacy/game-types';

import { adjudicateMovement } from './movement.js';

export interface Resolution {
  // Keyed by each submitted order's `unit`.
  readonly results: Readonly<Partial<Record<MapLocation, OrderResult>>>;
  readonly nextBoard: BoardState;
  readonly winner: Power | null;
}

export function resolve(board: BoardState, orders: readonly Order[]): Resolution {
  if (board.phaseType !== 'movement') {
    throw new Error(`NotImplemented: resolving ${board.phaseType} phases`);
  }
  const outcome = adjudicateMovement(board.units, orders);
  return {
    results: outcome.results,
    nextBoard: {
      ...board,
      phaseType: 'retreat',
      units: outcome.units,
      dislodged: outcome.dislodged,
      standoffs: outcome.standoffs,
    },
    winner: null,
  };
}
