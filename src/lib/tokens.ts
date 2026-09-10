import crypto from 'crypto';

// -----------------------------------------------------------------------------
// One-time, time-limited token helpers — used by the admin password reset
// flow in src/db/store.ts. Extracted so the expiry/hash-compare logic (the
// part that actually matters for security) can be unit tested without
// touching the file-based store or the filesystem.
//
// The plaintext token is never stored — only its SHA-256 hash, the same
// pattern used for admin passwords, so a leaked store.json/DB row can't be
// used to reset an account.
// -----------------------------------------------------------------------------

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface GeneratedToken {
  /** The plaintext token — send this to the user, never persist it. */
  token: string;
  /** SHA-256 hash of the token — this is what gets persisted. */
  tokenHash: string;
  /** ISO timestamp after which the token must be rejected. */
  expiresAt: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(now: number = Date.now(), ttlMs: number = RESET_TOKEN_TTL_MS): GeneratedToken {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now + ttlMs).toISOString(),
  };
}

/**
 * Verifies a submitted plaintext token against the stored hash + expiry.
 * Pure function — takes everything it needs as arguments so it can be
 * tested without a database, and reused identically by both the JSON store
 * and the future Postgres store.
 */
export function verifyResetToken(params: {
  submittedToken: string;
  storedTokenHash: string | undefined;
  storedExpiresAt: string | undefined;
  now?: number;
}): boolean {
  const { submittedToken, storedTokenHash, storedExpiresAt, now = Date.now() } = params;
  if (!storedTokenHash || !storedExpiresAt) return false;
  if (new Date(storedExpiresAt).getTime() < now) return false;
  return hashToken(submittedToken) === storedTokenHash;
}
