import { type OAuthProvider } from '@diplomacy/contracts';
import { type DbClient, users } from '@diplomacy/db';
import { and, eq, isNull, sql } from 'drizzle-orm';

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
  /** Provider of the linked OAuth identity, `null` when none is linked. */
  oauthProvider: string | null;
  oauthSubject: string | null;
}

export interface OAuthIdentityRef {
  provider: OAuthProvider;
  subject: string;
}

export interface CreateOAuthUserInput {
  email: string;
  username: string;
  identity: OAuthIdentityRef;
}

export interface LinkOAuthInput {
  identity: OAuthIdentityRef;
  /**
   * Drop the stored password hash. Used when linking to an account whose email
   * was never verified: whoever set that password never proved they own it.
   */
  clearPassword: boolean;
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
  /** Looks up the user linked to a provider identity. */
  findByOAuth(identity: OAuthIdentityRef): Promise<UserWithCredentials | null>;
  /** Inserts a verified, password-less user. Returns `null` on any unique conflict. */
  createOAuthUser(input: CreateOAuthUserInput): Promise<PublicUser | null>;
  /**
   * Links an identity to a user with no identity yet and marks the email verified.
   * Returns `false` if the user already has an identity or the identity is taken.
   */
  linkOAuth(userId: string, input: LinkOAuthInput): Promise<boolean>;
}

export function createUserRepository(db: DbClient): UserRepository {
  const selectCredentialColumns = {
    id: true as const,
    email: true as const,
    username: true as const,
    passwordHash: true as const,
    emailVerifiedAt: true as const,
    oauthProvider: true as const,
    oauthSubject: true as const,
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
      // Route on '@' so an email identifier never matches a username row and
      // vice versa. Avoids nondeterminism when a username and another user's
      // email collide after case-folding.
      const isEmail = identifier.includes('@');
      const row = await db.query.users.findFirst({
        columns: selectCredentialColumns,
        where: (u, { eq }) =>
          isEmail
            ? eq(u.email, identifier.toLowerCase())
            : sql`lower(${u.username}) = lower(${identifier})`,
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

    async findByOAuth({ provider, subject }) {
      const row = await db.query.users.findFirst({
        columns: selectCredentialColumns,
        where: (u) => and(eq(u.oauthProvider, provider), eq(u.oauthSubject, subject)),
      });
      return row ?? null;
    },

    async createOAuthUser({ email, username, identity }) {
      const [row] = await db
        .insert(users)
        .values({
          email,
          username,
          passwordHash: null,
          emailVerifiedAt: new Date(),
          oauthProvider: identity.provider,
          oauthSubject: identity.subject,
        })
        .onConflictDoNothing()
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
        });
      return row ?? null;
    },

    async linkOAuth(userId, { identity, clearPassword }) {
      const rows = await db
        .update(users)
        .set({
          oauthProvider: identity.provider,
          oauthSubject: identity.subject,
          emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
          ...(clearPassword && { passwordHash: null }),
        })
        .where(and(eq(users.id, userId), isNull(users.oauthProvider)))
        .returning({ id: users.id })
        .catch((err: unknown) => {
          if (isUniqueViolation(err)) {
            return [];
          }
          throw err;
        });
      return rows.length > 0;
    },
  };
}

function isUniqueViolation(err: unknown): boolean {
  const cause = err instanceof Error && err.cause !== undefined ? err.cause : err;
  return typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505';
}
