import { describe, it, expect } from "vitest";
import { formatDuration, formatLessonDuration, formatPrice } from "@/shared/lib/format";

describe("formatDuration", () => {
  it("formats seconds to hours and minutes", () => {
    expect(formatDuration(3661)).toBe("1h 1m");
  });

  it("formats zero hours", () => {
    expect(formatDuration(1800)).toBe("30m");
  });

  it("formats zero seconds", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("formats exactly one hour", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
  });

  it("formats multiple hours", () => {
    expect(formatDuration(7500)).toBe("2h 5m");
  });
});

describe("formatLessonDuration", () => {
  it("formats seconds to M:SS", () => {
    expect(formatLessonDuration(330)).toBe("5:30");
  });

  it("formats zero seconds", () => {
    expect(formatLessonDuration(0)).toBe("0:00");
  });

  it("formats single-digit seconds with padding", () => {
    expect(formatLessonDuration(65)).toBe("1:05");
  });

  it("formats exactly one minute", () => {
    expect(formatLessonDuration(60)).toBe("1:00");
  });

  it("formats large values", () => {
    expect(formatLessonDuration(600)).toBe("10:00");
  });
});

describe("formatPrice", () => {
  it("formats KRW by default", () => {
    expect(formatPrice(50000)).toBe("50,000원");
  });

  it("formats KRW explicitly", () => {
    expect(formatPrice(50000, "KRW")).toBe("50,000원");
  });

  it("formats USD", () => {
    expect(formatPrice(49.99, "USD")).toBe("$49.99");
  });

  it("formats zero KRW", () => {
    expect(formatPrice(0)).toBe("0원");
  });

  it("formats zero USD", () => {
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });

  it("formats large KRW", () => {
    expect(formatPrice(1500000)).toBe("1,500,000원");
  });

  it("formats negative KRW", () => {
    expect(formatPrice(-1000)).toBe("-1,000원");
  });
});
