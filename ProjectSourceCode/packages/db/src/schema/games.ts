import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { power } from './power.js';
import { users } from './users.js';

export const gameStatus = pgEnum('game_status', ['forming', 'active', 'finished', 'abandoned']);

export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    status: gameStatus('status').notNull().default('forming'),
    // SET NULL so the game survives if the creator deletes their account.
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    // Private games are joinable only by invite code; public games also accept open-slot joins.
    isPrivate: boolean('is_private').notNull().default(false),
    inviteCode: text('invite_code'),
    movementDeadlineSeconds: integer('movement_deadline_seconds').notNull().default(86400),
    // Hard cap on AI seats per game; enforced at the app layer, pinned here as a default.
    maxAiPowers: integer('max_ai_powers').notNull().default(4),
    // Set on a solo win. A finished game with no winner ended in a draw.
    winnerPower: power('winner_power'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('games_invite_code_idx').on(table.inviteCode),
    check(
      'games_winner_only_when_finished_check',
      sql`${table.winnerPower} IS NULL OR ${table.status} = 'finished'`,
    ),
  ],
);

export type GameRow = typeof games.$inferSelect;
export type GameInsert = typeof games.$inferInsert;
