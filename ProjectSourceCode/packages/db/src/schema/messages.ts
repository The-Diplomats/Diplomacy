import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { players } from './players.js';

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    fromPlayerId: uuid('from_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),

    toPlayerId: uuid('to_player_id').references(() => players.id, { onDelete: 'cascade' }),

    text: text('text').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('messages_game_id_created_at_idx').on(table.gameId, table.createdAt)],
);

export type MessageRow = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
