import { foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { players } from './players.js';

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    fromPlayerId: uuid('from_player_id').notNull(),

    // Null for public chat.
    toPlayerId: uuid('to_player_id'),

    text: text('text').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('messages_game_id_created_at_idx').on(table.gameId, table.createdAt),

    // Ensure both sender and recipient belong to this game. A null recipient skips the check.
    foreignKey({
      columns: [table.fromPlayerId, table.gameId],
      foreignColumns: [players.id, players.gameId],
      name: 'messages_from_player_game_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.toPlayerId, table.gameId],
      foreignColumns: [players.id, players.gameId],
      name: 'messages_to_player_game_fk',
    }).onDelete('cascade'),
  ],
);

export type MessageRow = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
