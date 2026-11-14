import { type DbClient, type MessageRow, messages } from '@diplomacy/db';

export interface MessageRepository {
  create(input: {
    gameId: string;
    fromPlayerId: string;
    toPlayerId?: string | null;
    text: string;
  }): Promise<MessageRow>;
  listPublicByGame(gameId: string): Promise<MessageRow[]>;
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
      return db.query.messages.findMany({
        where: (m, { and, eq, isNull }) => and(eq(m.gameId, gameId), isNull(m.toPlayerId)),
        orderBy: (m, { asc }) => [asc(m.createdAt)],
      });
    },
  };
}
