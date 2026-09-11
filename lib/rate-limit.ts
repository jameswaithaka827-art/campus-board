// Minimal in-memory fixed-window rate limiter.
//
// Good enough for a single-instance deployment (one Node process). If you
// deploy to Vercel or any multi-instance/serverless platform, each instance
// has its own memory, so this won't share state across them — swap this for
// a shared store like Upstash Redis (`@upstash/ratelimit`) before relying on
// it in a horizontally-scaled production environment.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clear expired buckets so this doesn't grow forever.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
(cleanupTimer as unknown as { unref?: () => void }).unref?.();

/**
 * Returns { allowed: false, retryAfterMs } if `key` has exceeded `limit`
 * requests within the last `windowMs`, otherwise { allowed: true }.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Best-effort client identifier for unauthenticated routes (signup, login).
// X-Forwarded-For can be spoofed by the client if you're not behind a proxy
// that overwrites it — Vercel and most reputable hosts do overwrite it, but
// verify that's true for wherever you deploy.
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
