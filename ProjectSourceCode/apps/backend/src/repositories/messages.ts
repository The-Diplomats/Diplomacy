import { type DbClient, type MessageRow, messages, players, users } from '@diplomacy/db';
import type { Power } from '@diplomacy/game-types';
import { and, asc, eq, getTableColumns, isNull } from 'drizzle-orm';

export type MessageWithSender = MessageRow & {
  fromUsername: string | null;
  fromPower: Power | null;
};

export interface MessageRepository {
  create(input: {
    gameId: string;
    fromPlayerId: string;
    toPlayerId?: string | null;
    text: string;
  }): Promise<MessageRow>;
  listPublicByGame(gameId: string): Promise<MessageWithSender[]>;
}

export function createMessageRepository(db: DbClient): MessageRepository {
  return {
    async create({ gameId, fromPlayerId, toPlayerId = null, text }) {
      const [row] = await db
        .insert(messages)
        .values({ gameId, fromPlayerId, toPlayerId, text })
        .returning();

      if (!row) {
        throw new Error('Failed to save message');
      }
      return row;
    },
    async listPublicByGame(gameId) {
      return db
        .select({
          ...getTableColumns(messages),
          fromUsername: users.username,
          fromPower: players.power,
        })
        .from(messages)
        .innerJoin(players, eq(messages.fromPlayerId, players.id))
        .leftJoin(users, eq(players.userId, users.id))
        .where(and(eq(messages.gameId, gameId), isNull(messages.toPlayerId)))
        .orderBy(asc(messages.createdAt));
    },
  };
}
