import { type DbClient, verificationTokens } from '@diplomacy/db';
import { and, eq, gte, isNull, lt } from 'drizzle-orm';

export type VerificationPurpose = 'email_verify' | 'password_reset';

export interface VerificationTokenRow {
  id: string;
  userId: string;
  purpose: VerificationPurpose;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateVerificationTokenInput {
  userId: string;
  purpose: VerificationPurpose;
  tokenHash: string;
  expiresAt: Date;
}

export interface VerificationTokenRepository {
  create(input: CreateVerificationTokenInput): Promise<VerificationTokenRow>;
  findActive(userId: string, purpose: VerificationPurpose): Promise<VerificationTokenRow | null>;
  findById(id: string): Promise<VerificationTokenRow | null>;
  markUsed(id: string): Promise<void>;
  /** Marks any outstanding tokens used before issuing a fresh one, so only one code is live at a time. */
  invalidateOutstanding(userId: string, purpose: VerificationPurpose): Promise<void>;
  deleteExpired(): Promise<number>;
}

export function createVerificationTokenRepository(db: DbClient): VerificationTokenRepository {
  return {
    async create(input) {
      const [row] = await db
        .insert(verificationTokens)
        .values({
          userId: input.userId,
          purpose: input.purpose,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        })
        .returning();
      if (!row) {
        throw new Error('Failed to insert verification token');
      }
      return row as VerificationTokenRow;
    },

    async findActive(userId, purpose) {
      const row = await db.query.verificationTokens.findFirst({
        where: (t) =>
          and(
            eq(t.userId, userId),
            eq(t.purpose, purpose),
            isNull(t.usedAt),
            gte(t.expiresAt, new Date()),
          ),
        orderBy: (t, { desc }) => desc(t.createdAt),
      });
      return (row as VerificationTokenRow | undefined) ?? null;
    },

    async findById(id) {
      const row = await db.query.verificationTokens.findFirst({
        where: (t) => eq(t.id, id),
      });
      return (row as VerificationTokenRow | undefined) ?? null;
    },

    async markUsed(id) {
      await db
        .update(verificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(verificationTokens.id, id));
    },

    async invalidateOutstanding(userId, purpose) {
      await db
        .update(verificationTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(verificationTokens.userId, userId),
            eq(verificationTokens.purpose, purpose),
            isNull(verificationTokens.usedAt),
          ),
        );
    },

    async deleteExpired() {
      const result = await db
        .delete(verificationTokens)
        .where(lt(verificationTokens.expiresAt, new Date()));
      return result.rowCount ?? 0;
    },
  };
}
