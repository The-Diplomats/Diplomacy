import { type DbClient, users } from '@diplomacy/db';
import { and, ne, or, sql } from 'drizzle-orm';

import { hashPassword } from '../../auth/password.js';

export interface ScenarioUser {
  id: string;
  email: string;
  username: string;
}

// These passwords guard accounts on deployed envs, so they are held to a higher bar than sign-up.
const MIN_PASSWORD_LENGTH = 16;

export function requirePassword(name: string): string {
  const value = process.env[name];
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${name} must be set to at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return value;
}

/**
 * Inserts the user on its stable id, or resets it, as a verified password-only account. Refuses
 * when another account already holds the email or username, so a sign-up can't be taken over.
 */
export async function upsertVerifiedUser(
  db: DbClient,
  user: ScenarioUser,
  password: string,
): Promise<void> {
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        ne(users.id, user.id),
        or(
          sql`lower(${users.email}) = lower(${user.email})`,
          sql`lower(${users.username}) = lower(${user.username})`,
        ),
      ),
    )
    .limit(1);
  if (taken) {
    throw new Error(
      `${user.email} or ${user.username} already belongs to account ${taken.id}; remove it first`,
    );
  }

  const account = {
    email: user.email,
    username: user.username,
    passwordHash: await hashPassword(password),
    emailVerifiedAt: new Date(),
  };
  await db
    .insert(users)
    .values({ id: user.id, ...account })
    .onConflictDoUpdate({ target: users.id, set: account });
}
