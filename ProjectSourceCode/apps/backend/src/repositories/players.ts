import { type DbClient, players, users } from '@diplomacy/db';
import type { Power } from '@diplomacy/game-types';
import { asc, eq, getTableColumns } from 'drizzle-orm';

export type PlayerSeat = typeof players.$inferSelect;
export type PlayerWithUsername = PlayerSeat & { username: string | null };

export interface PlayerRepository {
  /** Seats a user or AI into a game. Returns null when the seat (or power) is already taken. */
  addSeat(input: {
    gameId: string;
    userId: string | null;
    isAi?: boolean;
    power?: Power;
  }): Promise<PlayerSeat | null>;

  /** Lists every seat in a game. */
  findByGame(gameId: string): Promise<PlayerSeat[]>;

  /** Lists every seat in a game including the users' usernames in join order */
  listWithUsernamesByGame(gameId: string): Promise<PlayerWithUsername[]>;

  /** Retrieves a user's seat in a specific game. */
  findByUserInGame(input: { gameId: string; userId: string }): Promise<PlayerSeat | null>;
}

export function createPlayerRepository(db: DbClient): PlayerRepository {
  return {
    async addSeat({ gameId, userId, isAi = false, power }) {
      const [row] = await db
        .insert(players)
        .values({ gameId, userId, isAi, power })
        .onConflictDoNothing()
        .returning();

      return row ?? null;
    },

    async findByGame(gameId) {
      return db.query.players.findMany({
        where: (p, { eq }) => eq(p.gameId, gameId),
      });
    },

    async listWithUsernamesByGame(gameId) {
      return db
        .select({ ...getTableColumns(players), username: users.username })
        .from(players)
        .leftJoin(users, eq(players.userId, users.id))
        .where(eq(players.gameId, gameId))
        .orderBy(asc(players.joinedAt));
    },

    async findByUserInGame({ gameId, userId }) {
      const row = await db.query.players.findFirst({
        where: (p, { and, eq }) => and(eq(p.gameId, gameId), eq(p.userId, userId)),
      });
      return row ?? null;
    },
  };
}
