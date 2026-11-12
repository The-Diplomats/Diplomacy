import { POWERS } from '@diplomacy/game-types';
import { boolean, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { users } from './users.js';

export const power = pgEnum('power', POWERS);

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
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('players_game_user_idx').on(table.gameId, table.userId),
    uniqueIndex('players_game_power_idx').on(table.gameId, table.power),
  ],
);

export type PlayerRow = typeof players.$inferSelect;
export type PlayerInsert = typeof players.$inferInsert;
