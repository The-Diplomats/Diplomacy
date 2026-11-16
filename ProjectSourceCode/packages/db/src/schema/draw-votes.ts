import { foreignKey, index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { players } from './players.js';

export const drawVotes = pgTable(
  'draw_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Game in which the draw vote was submitted.
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    // Player casting the draw vote. The row's presence is the vote; withdrawing deletes it.
    playerId: uuid('player_id').notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One draw vote per player per game.
    uniqueIndex('draw_votes_game_player_idx').on(table.gameId, table.playerId),

    index('draw_votes_player_idx').on(table.playerId),

    // Ensure the player belongs to the game being voted on.
    foreignKey({
      columns: [table.playerId, table.gameId],
      foreignColumns: [players.id, players.gameId],
      name: 'draw_votes_player_game_fk',
    }).onDelete('cascade'),
  ],
);

export type DrawVoteRow = typeof drawVotes.$inferSelect;
export type DrawVoteInsert = typeof drawVotes.$inferInsert;
