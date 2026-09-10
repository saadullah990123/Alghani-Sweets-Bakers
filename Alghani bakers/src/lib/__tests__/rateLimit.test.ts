import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkRateLimit, getClientIdentifier } from '../rateLimit';

describe('checkRateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the max within the window', () => {
    const key = `test-allow-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
    }
  });

  it('rejects the request once the max is exceeded within the window', () => {
    const key = `test-reject-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { windowMs: 60_000, max: 3 });
    }
    const result = checkRateLimit(key, { windowMs: 60_000, max: 3 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets the count once the window has elapsed', () => {
    vi.useFakeTimers();
    const key = `test-reset-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { windowMs: 1000, max: 3 });
    }
    expect(checkRateLimit(key, { windowMs: 1000, max: 3 }).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, { windowMs: 1000, max: 3 }).allowed).toBe(true);
  });

  it('tracks separate keys independently (different routes/clients never share a bucket)', () => {
    const keyA = `test-independent-a-${Math.random()}`;
    const keyB = `test-independent-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, { windowMs: 60_000, max: 5 });
    // keyA is now exhausted, but keyB should be unaffected.
    expect(checkRateLimit(keyA, { windowMs: 60_000, max: 5 }).allowed).toBe(false);
    expect(checkRateLimit(keyB, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
  });
});

describe('getClientIdentifier', () => {
  it('reads the first IP from x-forwarded-for', () => {
    const req = new Request('https://example.com', { headers: { 'x-forwarded-for': '203.0.113.4, 10.0.0.1' } });
    expect(getClientIdentifier(req)).toBe('203.0.113.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('https://example.com', { headers: { 'x-real-ip': '198.51.100.7' } });
    expect(getClientIdentifier(req)).toBe('198.51.100.7');
  });

  it('falls back to a constant when neither header is present', () => {
    const req = new Request('https://example.com');
    expect(getClientIdentifier(req)).toBe('unknown');
  });
});
