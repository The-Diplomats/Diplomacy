import type { Order } from '@diplomacy/game-types';
import { ORDER_ACTIONS, ORDER_RESULTS } from '@diplomacy/game-types';
import {
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { phases } from './phases.js';
import { players } from './players.js';

export const orderAction = pgEnum('order_action', ORDER_ACTIONS);

export const orderResult = pgEnum('order_result', ORDER_RESULTS);

// Distributes over the union so each action keeps its own fields.
export type OrderDetails = Order extends infer Variant
  ? Variant extends Order
    ? Omit<Variant, 'unit' | 'action'>
    : never
  : never;

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Game this order belongs to.
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    phaseId: uuid('phase_id').notNull(),

    playerId: uuid('player_id').notNull(),

    // Province containing the unit.
    unit: text('unit').notNull(),

    // Type of order being submitted.
    action: orderAction('action').notNull(),

    // Order details beyond unit and action, which live in their own columns.
    orderData: jsonb('order_data').$type<OrderDetails>().notNull(),

    // Null until adjudication.
    result: orderResult('result'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    // Orders are upserted as players revise them during the phase.
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Each unit can have only one order per phase.
    uniqueIndex('orders_phase_unit_idx').on(table.phaseId, table.unit),

    index('orders_phase_player_idx').on(table.phaseId, table.playerId),

    // Ensure the phase belongs to the specified game.
    foreignKey({
      columns: [table.phaseId, table.gameId],
      foreignColumns: [phases.id, phases.gameId],
      name: 'orders_phase_game_fk',
    }).onDelete('cascade'),

    // Ensure the player belongs to the specified game.
    foreignKey({
      columns: [table.playerId, table.gameId],
      foreignColumns: [players.id, players.gameId],
      name: 'orders_player_game_fk',
    }).onDelete('cascade'),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
