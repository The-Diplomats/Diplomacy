import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { power } from './power.js';
import { users } from './users.js';

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    // Null for AI seats; NULLs are distinct in postgres so multiple AI seats coexist.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Null while the game is forming; assigned when the game starts.
    power: power('power'),

    isAi: boolean('is_ai').notNull().default(false),

    // Tracks how many times a player has been AFK.
    afkCounter: integer('afk_counter').notNull().default(0),

    // Indicates whether the player's seat is locked.
    locked: boolean('locked').notNull().default(false),

    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('players_game_user_idx').on(table.gameId, table.userId),
    uniqueIndex('players_game_power_idx').on(table.gameId, table.power),

    // Allows other tables to enforce that a player belongs to the correct game.
    uniqueIndex('players_id_game_idx').on(table.id, table.gameId),

    check('players_ai_has_no_user_check', sql`${table.isAi} = (${table.userId} IS NULL)`),
  ],
);

export type PlayerRow = typeof players.$inferSelect;
export type PlayerInsert = typeof players.$inferInsert;
