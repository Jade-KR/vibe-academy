/**
 * Simple in-memory rate limiter.
 *
 * Creates a sliding-window rate limiter keyed by an arbitrary string (e.g. email).
 * Each call to `isLimited` records the attempt and returns `true` when the
 * caller has exceeded `maxAttempts` within the last `windowMs` milliseconds.
 *
 * NOTE: This is per-process only. In a multi-instance deployment, consider a
 * Redis-backed limiter instead.
 */

export interface RateLimitOptions {
  /** Maximum number of attempts allowed within the window. */
  maxAttempts: number;
  /** Sliding window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimiter {
  /** Returns `true` if the key has exceeded the rate limit, `false` otherwise. */
  isLimited(key: string): boolean;
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const { maxAttempts, windowMs } = options;
  const map = new Map<string, number[]>();

  return {
    isLimited(key: string): boolean {
      const now = Date.now();
      const timestamps = map.get(key) ?? [];

      // Keep only timestamps within the sliding window
      const recent = timestamps.filter((t) => now - t < windowMs);

      if (recent.length >= maxAttempts) {
        map.set(key, recent);
        return true;
      }

      recent.push(now);
      map.set(key, recent);
      return false;
    },
  };
}
