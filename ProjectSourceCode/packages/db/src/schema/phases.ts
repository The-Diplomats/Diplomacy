import type { BoardState } from '@diplomacy/game-types';
import { PHASE_TYPES, SEASONS } from '@diplomacy/game-types';
import { sql } from 'drizzle-orm';
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

export const season = pgEnum('season', SEASONS);

export const phases = pgTable(
  'phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Game this phase belongs to.
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    // Game year, starting at 1901.
    year: integer('year').notNull(),

    // Build phases are recorded as fall.
    season: season('season').notNull(),

    // Movement, retreat, or build.
    phaseType: phaseType('phase_type').notNull(),

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
    // At most one unresolved phase per game; also serves the current-phase lookup.
    uniqueIndex('phases_game_open_idx')
      .on(table.gameId)
      .where(sql`${table.resolvedAt} IS NULL`),

    // One row per point on the game clock, e.g. Fall 1901 retreat.
    uniqueIndex('phases_game_clock_idx').on(
      table.gameId,
      table.year,
      table.season,
      table.phaseType,
    ),

    // Phase history for a game, oldest first.
    index('phases_game_created_at_idx').on(table.gameId, table.createdAt),

    // Efficiently find phases approaching their deadline.
    index('phases_deadline_at_idx').on(table.deadlineAt),

    // Allows dependent tables to verify phase/game membership.
    uniqueIndex('phases_id_game_idx').on(table.id, table.gameId),
  ],
);

export type PhaseRow = typeof phases.$inferSelect;
export type PhaseInsert = typeof phases.$inferInsert;
