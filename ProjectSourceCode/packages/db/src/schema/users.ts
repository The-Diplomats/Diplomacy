import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    passwordHash: text('password_hash'),
    // NULL until the user verifies their email; populated on successful verify.
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    oauthProvider: text('oauth_provider'),
    oauthSubject: text('oauth_subject'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Case-insensitive uniqueness. App normalizes email to lowercase on write;
    // the functional index enforces it even if a code path forgets to normalize.
    uniqueIndex('users_email_lower_idx').on(sql`lower(${table.email})`),
    // Case-insensitive uniqueness for login-by-username; preserves display case.
    uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
