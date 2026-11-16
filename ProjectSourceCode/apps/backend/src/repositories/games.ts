import { type DbClient, type GameRow, games } from '@diplomacy/db';

export type Game = GameRow;
export type GameStatus = Game['status'];

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

      return row;
    },

    async findById(id) {
      const row = await db.query.games.findFirst({
        where: (g, { eq }) => eq(g.id, id),
      });
      return row ?? null;
    },
  };
}
