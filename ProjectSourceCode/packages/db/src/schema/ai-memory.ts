import { jsonb, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { power } from './players.js';

export const aiMemory = pgTable(
  'ai_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    power: power('power').notNull(),

    memory: jsonb('memory').$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('ai_memory_game_power_idx').on(table.gameId, table.power)],
);

export type AiMemoryRow = typeof aiMemory.$inferSelect;
export type AiMemoryInsert = typeof aiMemory.$inferInsert;
