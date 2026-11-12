import { type DbClient, games } from '@diplomacy/db';

export type GameStatus = 'forming' | 'active' | 'finished' | 'abandoned';

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  createdByUserId: string | null;
  movementDeadlineSeconds: number;
  maxAiPowers: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

export interface GameRepository {
  create(input: {
    name: string;
    createdByUserId: string;
    movementDeadlineSeconds?: number;
    maxAiPowers?: number;
  }): Promise<Game>;

  findById(id: string): Promise<Game | null>;
}

export function createGameRepository(db: DbClient): GameRepository {
  return {
    async create({ name, createdByUserId, movementDeadlineSeconds, maxAiPowers }) {
      const [row] = await db
        .insert(games)
        .values({ name, createdByUserId, movementDeadlineSeconds, maxAiPowers })
        .returning();

      if (!row) {
        throw new Error('Failed to insert game');
      }

      return row as Game;
    },

    async findById(id) {
      const row = await db.query.games.findFirst({
        where: (g, { eq }) => eq(g.id, id),
      });
      return (row as Game | undefined) ?? null;
    },
  };
}
