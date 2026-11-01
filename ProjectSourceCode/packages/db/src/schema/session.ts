import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const session = pgTable(
  'session',
  {
    sid: text('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire', { precision: 6, withTimezone: false }).notNull(),
  },
  (table) => ({
    expireIdx: index('idx_session_expire').on(table.expire),
  }),
);

export type SessionRow = typeof session.$inferSelect;
