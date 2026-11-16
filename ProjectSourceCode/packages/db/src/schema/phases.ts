import type { BoardState } from '@diplomacy/game-types';
import { PHASE_TYPES } from '@diplomacy/game-types';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.js';

// Valid phase types used by the Diplomacy game.
export const phaseType = pgEnum('phase_type', PHASE_TYPES);

export const phases = pgTable(
  'phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Game this phase belongs to.
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    // Movement, retreat, or build.
    phaseType: phaseType('phase_type').notNull(),

    // Current game turn.
    turn: integer('turn').notNull(),

    // Snapshot of the board during this phase.
    boardState: jsonb('board_state').$type<BoardState>().notNull(),

    // Deadline for submitting orders.
    deadlineAt: timestamp('deadline_at', {
      withTimezone: true,
    }).notNull(),

    // Prevents outdated scheduler jobs from resolving a phase.
    schedulerGen: integer('scheduler_gen').notNull().default(0),

    // Null until the phase has been resolved.
    resolvedAt: timestamp('resolved_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Find all phases for a game.
    index('phases_game_id_idx').on(table.gameId),

    // Efficiently find phases approaching their deadline.
    index('phases_deadline_at_idx').on(table.deadlineAt),

    // Allows dependent tables to verify phase/game membership.
    uniqueIndex('phases_id_game_idx').on(table.id, table.gameId),
  ],
);

export type PhaseRow = typeof phases.$inferSelect;
export type PhaseInsert = typeof phases.$inferInsert;
