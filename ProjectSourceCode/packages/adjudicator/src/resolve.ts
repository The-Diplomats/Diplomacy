import type { BoardState, Order } from '@diplomacy/game-types';

export interface Resolution {
  readonly nextBoard: BoardState;
  readonly resolvedOrders: readonly Order[];
}

export function resolve(_board: BoardState, _orders: readonly Order[]): Resolution {
  throw new Error('NotImplemented: @diplomacy/adjudicator resolve() is a scaffold stub');
}
