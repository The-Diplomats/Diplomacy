import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const gameStatus = pgEnum('game_status', ['forming', 'active', 'finished', 'abandoned']);

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: gameStatus('status').notNull().default('forming'),
  // SET NULL so the game survives if the creator deletes their account.
  createdByUserId: uuid('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  movementDeadlineSeconds: integer('movement_deadline_seconds').notNull().default(86400),
  // Hard cap on AI seats per game; enforced at the app layer, pinned here as a default.
  maxAiPowers: integer('max_ai_powers').notNull().default(4),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type GameRow = typeof games.$inferSelect;
export type GameInsert = typeof games.$inferInsert;
