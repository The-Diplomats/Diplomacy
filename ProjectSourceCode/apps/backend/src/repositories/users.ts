import { type DbClient, users } from '@diplomacy/db';

export interface PublicUser {
  id: string;
  email: string;
}

export interface UserWithCredentials extends PublicUser {
  /** `null` for accounts that only sign in via OAuth. */
  passwordHash: string | null;
}

export interface UserRepository {
  /** Inserts a user. Returns `null` if the email is already taken. */
  create(input: { email: string; passwordHash: string }): Promise<PublicUser | null>;
  /** Looks up a user by (already normalized) email, including the password hash. */
  findByEmail(email: string): Promise<UserWithCredentials | null>;
}

export function createUserRepository(db: DbClient): UserRepository {
  return {
    async create({ email, passwordHash }) {
      const [row] = await db
        .insert(users)
        .values({ email, passwordHash })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id, email: users.email });
      return row ?? null;
    },

    async findByEmail(email) {
      const row = await db.query.users.findFirst({
        columns: { id: true, email: true, passwordHash: true },
        where: (u, { eq }) => eq(u.email, email),
      });
      return row ?? null;
    },
  };
}
