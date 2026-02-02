import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "@/shared/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 });
    expect(limiter.isLimited("user@test.com")).toBe(false);
    expect(limiter.isLimited("user@test.com")).toBe(false);
    expect(limiter.isLimited("user@test.com")).toBe(false);
  });

  it("blocks after exceeding maxAttempts", () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60_000 });
    limiter.isLimited("key");
    limiter.isLimited("key");
    expect(limiter.isLimited("key")).toBe(true);
  });

  it("uses separate counters for different keys", () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isLimited("key-a");
    // key-a is now exhausted
    expect(limiter.isLimited("key-a")).toBe(true);
    // key-b should still be allowed
    expect(limiter.isLimited("key-b")).toBe(false);
  });

  it("allows requests after window expires", () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isLimited("key");
    expect(limiter.isLimited("key")).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(limiter.isLimited("key")).toBe(false);
  });

  it("handles exact boundary (at maxAttempts)", () => {
    const limiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 });
    // 3 calls should all return false (allowed)
    expect(limiter.isLimited("key")).toBe(false);
    expect(limiter.isLimited("key")).toBe(false);
    expect(limiter.isLimited("key")).toBe(false);
    // 4th call should be limited
    expect(limiter.isLimited("key")).toBe(true);
  });

  it("sliding window only removes expired timestamps", () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 100 });

    limiter.isLimited("key"); // t=0
    vi.advanceTimersByTime(50);
    limiter.isLimited("key"); // t=50
    // Now at limit (2 attempts)
    expect(limiter.isLimited("key")).toBe(true); // t=50, blocked

    vi.advanceTimersByTime(51); // t=101 - first timestamp expires
    expect(limiter.isLimited("key")).toBe(false); // t=101, first expired so allowed
  });
});
