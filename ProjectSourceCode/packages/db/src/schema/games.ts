import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const gameStatus = pgEnum('game_status', ['forming', 'active', 'finished', 'abandoned']);

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: gameStatus('status').notNull().default('forming'),
  movementDeadlineSeconds: integer('movement_deadline_seconds').notNull().default(86400),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type GameRow = typeof games.$inferSelect;
export type GameInsert = typeof games.$inferInsert;
