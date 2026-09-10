import { describe, it, expect } from 'vitest';
import { generateResetToken, verifyResetToken, hashToken, RESET_TOKEN_TTL_MS } from '../tokens';

describe('generateResetToken', () => {
  it('produces a token whose hash matches hashToken(token)', () => {
    const { token, tokenHash } = generateResetToken();
    expect(hashToken(token)).toBe(tokenHash);
  });

  it('never returns the same token twice', () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
  });

  it('sets an expiry one hour in the future by default', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const { expiresAt } = generateResetToken(now);
    expect(Date.parse(expiresAt) - now).toBe(RESET_TOKEN_TTL_MS);
  });
});

describe('verifyResetToken', () => {
  it('accepts a correct token before expiry', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const { token, tokenHash, expiresAt } = generateResetToken(now);
    const ok = verifyResetToken({
      submittedToken: token,
      storedTokenHash: tokenHash,
      storedExpiresAt: expiresAt,
      now: now + 1000, // 1 second later, still valid
    });
    expect(ok).toBe(true);
  });

  it('rejects a token after it has expired', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const { token, tokenHash, expiresAt } = generateResetToken(now);
    const ok = verifyResetToken({
      submittedToken: token,
      storedTokenHash: tokenHash,
      storedExpiresAt: expiresAt,
      now: now + RESET_TOKEN_TTL_MS + 1, // 1ms past expiry
    });
    expect(ok).toBe(false);
  });

  it('rejects a wrong/tampered token even if not expired', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const { tokenHash, expiresAt } = generateResetToken(now);
    const ok = verifyResetToken({
      submittedToken: 'not-the-real-token',
      storedTokenHash: tokenHash,
      storedExpiresAt: expiresAt,
      now,
    });
    expect(ok).toBe(false);
  });

  it('rejects when there is no stored token at all (nothing requested, or already consumed)', () => {
    const ok = verifyResetToken({
      submittedToken: 'anything',
      storedTokenHash: undefined,
      storedExpiresAt: undefined,
    });
    expect(ok).toBe(false);
  });
});
