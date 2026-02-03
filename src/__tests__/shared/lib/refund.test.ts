import { describe, it, expect } from "vitest";
import { isRefundEligible } from "@/shared/lib/refund";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("isRefundEligible", () => {
  it("returns eligible when within 3 days and 2 lessons watched", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 3 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 2, now });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("returns ineligible when 3 days but 5 lessons watched", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 3 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 5, now });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Lesson watch limit exceeded");
  });

  it("returns ineligible when 8 days and 2 lessons watched", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 8 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 2, now });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Refund window expired");
  });

  it("returns ineligible when 8 days and 6 lessons watched", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 8 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 6, now });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Refund window expired and lesson limit exceeded");
  });

  it("returns eligible at exactly 7 days boundary with 4 lessons", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 7 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 4, now });
    expect(result.eligible).toBe(true);
  });

  it("returns ineligible at 7 days + 1ms with 0 lessons", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 7 * DAY_MS - 1);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 0, now });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Refund window expired");
  });

  it("returns eligible when just purchased with 0 lessons", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const result = isRefundEligible({ purchasedAt: now, lessonsWatched: 0, now });
    expect(result.eligible).toBe(true);
  });

  it("returns ineligible at 6 days with exactly 5 lessons (5 is NOT < 5)", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 6 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 5, now });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Lesson watch limit exceeded");
  });

  it("returns eligible when 1 day and 0 lessons watched", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const purchasedAt = new Date(now.getTime() - 1 * DAY_MS);
    const result = isRefundEligible({ purchasedAt, lessonsWatched: 0, now });
    expect(result.eligible).toBe(true);
  });
});
