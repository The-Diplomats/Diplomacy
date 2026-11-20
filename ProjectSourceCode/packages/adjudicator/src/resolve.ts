import type { BoardState, MapLocation, Order, OrderResult, Power } from '@diplomacy/game-types';

import { resolveBuilds } from './adjustments.js';
import { adjudicateMovement } from './movement.js';
import { type Advance, afterBuilds, afterMovement, afterRetreats } from './phases.js';
import { resolveRetreats } from './retreats.js';

export interface Resolution {
  // Keyed by order `unit`; only orders the phase can act on, first order per unit.
  readonly results: Readonly<Partial<Record<MapLocation, OrderResult>>>;
  // The next phase that needs decisions; empty retreat and build phases are skipped.
  readonly nextBoard: BoardState;
  // Set when a power reaches the solo victory count at the end of a year.
  readonly winner: Power | null;
}

export function resolve(board: BoardState, orders: readonly Order[]): Resolution {
  let results: Resolution['results'];
  let advance: Advance;
  switch (board.phaseType) {
    case 'movement': {
      const outcome = adjudicateMovement(board.units, orders);
      results = outcome.results;
      advance = afterMovement(board, outcome.units, outcome.dislodged, outcome.standoffs);
      break;
    }
    case 'retreat': {
      const outcome = resolveRetreats(board, orders);
      results = outcome.results;
      advance = afterRetreats(board, outcome.units);
      break;
    }
    case 'build': {
      const outcome = resolveBuilds(board, orders);
      results = outcome.results;
      advance = afterBuilds(board, outcome.units);
      break;
    }
  }
  return { results, nextBoard: advance.board, winner: advance.winner };
}
