import { createHash, randomInt } from 'node:crypto';

export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const VERIFICATION_CODE_TTL_MS = VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;

/** Six-digit numeric code, zero-padded. Short enough to type from an email. */
export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Hashes the code at rest so a leaked token_hash column can't be replayed. */
export function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
