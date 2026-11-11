import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

/**
 * Unified short-lived token store for email verification and password reset.
 * `purpose` discriminates the two use cases; both share token_hash + expiry
 * + used_at semantics.
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull(), // 'email_verify' | 'password_reset'
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('verification_tokens_user_purpose_idx').on(table.userId, table.purpose),
    index('verification_tokens_expires_at_idx').on(table.expiresAt),
  ],
);

export type VerificationTokenRow = typeof verificationTokens.$inferSelect;
export type VerificationTokenInsert = typeof verificationTokens.$inferInsert;
