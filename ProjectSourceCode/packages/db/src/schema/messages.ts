import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  author: text('author'),
  content: text('msg_content'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ChatRow = typeof users.$inferSelect;
export type ChatInsert = typeof users.$inferInsert;
