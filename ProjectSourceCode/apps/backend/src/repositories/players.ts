import { type DbClient, players } from '@diplomacy/db';
import type { Power } from '@diplomacy/game-types';

export interface PlayerSeat {
  id: string;
  gameId: string;
  userId: string | null;
  power: Power | null;
  isAi: boolean;
  joinedAt: Date;
}

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

      return (row as PlayerSeat | undefined) ?? null;
    },

    async findByGame(gameId) {
      const rows = await db.query.players.findMany({
        where: (p, { eq }) => eq(p.gameId, gameId),
      });
      return rows as PlayerSeat[];
    },

    async findByUserInGame({ gameId, userId }) {
      const row = await db.query.players.findFirst({
        where: (p, { and, eq }) => and(eq(p.gameId, gameId), eq(p.userId, userId)),
      });
      return (row as PlayerSeat | undefined) ?? null;
    },
  };
}
