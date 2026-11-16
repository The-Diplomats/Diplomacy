import {
  boolean,
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.js';
import { phases } from './phases.js';
import { players } from './players.js';

export const phaseReadiness = pgTable(
  'phase_readiness',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Game this readiness record belongs to.
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),

    // Phase this readiness record belongs to.
    phaseId: uuid('phase_id').notNull(),

    // Player submitting readiness.
    playerId: uuid('player_id').notNull(),

    // Whether the player is ready.
    isReady: boolean('is_ready').notNull().default(false),

    // Whether the player voted to skip the grace period.
    skipGraceVote: boolean('skip_grace_vote').notNull().default(false),

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
  (table) => [
    // Only one readiness record per player per phase.
    uniqueIndex('phase_readiness_phase_player_idx').on(table.phaseId, table.playerId),

    index('phase_readiness_player_idx').on(table.playerId),

    // Verify that the phase belongs to this game.
    foreignKey({
      columns: [table.phaseId, table.gameId],
      foreignColumns: [phases.id, phases.gameId],
      name: 'phase_readiness_phase_game_fk',
    }).onDelete('cascade'),

    // Verify that the player belongs to this game.
    foreignKey({
      columns: [table.playerId, table.gameId],
      foreignColumns: [players.id, players.gameId],
      name: 'phase_readiness_player_game_fk',
    }).onDelete('cascade'),
  ],
);

export type PhaseReadinessRow = typeof phaseReadiness.$inferSelect;
export type PhaseReadinessInsert = typeof phaseReadiness.$inferInsert;
