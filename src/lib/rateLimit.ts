import { NextResponse } from 'next/server';

// -----------------------------------------------------------------------------
// IN-MEMORY RATE LIMITER — Performance + Scalability Audit Finding 10-A
// -----------------------------------------------------------------------------
// A simple fixed-window counter, keyed by route + client identifier, held in
// a module-level Map. This is intentionally NOT backed by Redis: per the
// audit, Redis is classified OPTIONAL AT CURRENT SCALE for this specific
// need. An in-memory limiter is correct and sufficient for a single server
// process. If/when this app runs more than one instance at once (multiple
// Vercel serverless instances, or multiple server processes behind a load
// balancer), each instance holds its OWN counters, so the effective limit
// becomes (limit × instance count) rather than one true shared limit.
// Revisit with Redis (or Vercel KV) at that point — not before.
// -----------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so this Map doesn't grow forever under
// sustained traffic from many distinct client identifiers. This is a small,
// deliberate cleanup pass — not a cache and not meant to persist across
// restarts (an in-memory Map never does).
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();
function sweepExpiredIfDue() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry — only set when `allowed` is false. */
  retryAfterSeconds?: number;
}

/**
 * Fixed-window rate limit check. `key` should already include both a route
 * identifier and the client identifier (e.g. "login:203.0.113.4") so
 * different endpoints never share a counter with each other.
 */
export function checkRateLimit(key: string, options: { windowMs: number; max: number }): RateLimitResult {
  sweepExpiredIfDue();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (existing.count >= options.max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { allowed: true };
}

/**
 * Best-effort client identifier from standard proxy headers (this is what
 * Vercel and most reverse proxies set). Falls back to a constant string
 * rather than throwing if neither header is present (e.g. local dev with no
 * proxy in front) — in that fallback case every request shares one bucket,
 * which is a reasonable degradation, not a broken limiter.
 */
export function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/** Standard 429 JSON response with a `Retry-After` header. */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
