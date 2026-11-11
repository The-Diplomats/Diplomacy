import { type DbClient, players } from '@diplomacy/db';

export interface PlayerProfile {
  id: string;
  userId: string;
  username: string;
  createdAt: Date;
}

export interface PlayerRepository {
  /** Creates a player profile. Returns null if the username or user ID is taken. */
  create(input: { userId: string; username: string }): Promise<PlayerProfile | null>;

  /** Retrieves a player profile by its unique ID. */
  findById(id: string): Promise<PlayerProfile | null>;

  /** Retrieves a player profile by username. */
  findByUsername(username: string): Promise<PlayerProfile | null>;

  /** Retrieves a player profile by user id **/
  /** This may need to change later after database adjustments **/
  findByUserId(userId: string): Promise<PlayerProfile | null>;
}

export function createPlayerRepository(db: DbClient): PlayerRepository {
  return {
    async create({ userId, username }) {
      const [row] = await db
        .insert(players)
        .values({ userId, username })
        .onConflictDoNothing()
        .returning();

      return row ?? null;
    },

    async findById(id) {
      const row = await db.query.players.findFirst({
        where: (p, { eq }) => eq(p.id, id),
      });

      return row ?? null;
    },

    async findByUsername(username) {
      const row = await db.query.players.findFirst({
        where: (p, { eq }) => eq(p.username, username),
      });

      return row ?? null;
    },

    async findByUserId(userId) {
      const row = await db.query.players.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });

      return row ?? null;
    },
  };
}
