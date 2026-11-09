import { type DbClient, users } from '@diplomacy/db';
import { or, sql } from 'drizzle-orm';

export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

export interface UserWithCredentials extends PublicUser {
  /** `null` for accounts that only sign in via OAuth. */
  passwordHash: string | null;
  /** `null` until the user has verified their email. */
  emailVerifiedAt: Date | null;
}

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export interface UserRepository {
  /** Inserts a user. Returns `null` if the email or username is already taken. */
  create(input: CreateUserInput): Promise<PublicUser | null>;
  /** Looks up a user by email (already normalized to lowercase). */
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  /** Looks up a user by username (case-insensitive). */
  findByUsername(username: string): Promise<UserWithCredentials | null>;
  /** Looks up a user by either email or username; used by the login flow. */
  findByIdentifier(identifier: string): Promise<UserWithCredentials | null>;
  /** Marks the user as verified. */
  markEmailVerified(userId: string): Promise<void>;
  /** Updates the password hash (used after a password reset). */
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export function createUserRepository(db: DbClient): UserRepository {
  const selectCredentialColumns = {
    id: true as const,
    email: true as const,
    username: true as const,
    passwordHash: true as const,
    emailVerifiedAt: true as const,
  };

  return {
    async create({ email, username, passwordHash }) {
      const [row] = await db
        .insert(users)
        .values({ email, username, passwordHash })
        // Conflict on email OR username; ON CONFLICT DO NOTHING without a
        // target catches any unique violation and returns no row. Callers
        // treat null as "already taken".
        .onConflictDoNothing()
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
        });
      return row ?? null;
    },

    async findByEmail(email) {
      const row = await db.query.users.findFirst({
        columns: selectCredentialColumns,
        where: (u, { eq }) => eq(u.email, email),
      });
      return row ?? null;
    },

    async findByUsername(username) {
      const row = await db.query.users.findFirst({
        columns: selectCredentialColumns,
        where: (u) => sql`lower(${u.username}) = lower(${username})`,
      });
      return row ?? null;
    },

    async findByIdentifier(identifier) {
      const row = await db.query.users.findFirst({
        columns: selectCredentialColumns,
        where: (u, { eq }) =>
          or(
            eq(u.email, identifier.toLowerCase()),
            sql`lower(${u.username}) = lower(${identifier})`,
          ),
      });
      return row ?? null;
    },

    async markEmailVerified(userId) {
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(sql`${users.id} = ${userId}`);
    },

    async updatePasswordHash(userId, passwordHash) {
      await db
        .update(users)
        .set({ passwordHash })
        .where(sql`${users.id} = ${userId}`);
    },
  };
}
