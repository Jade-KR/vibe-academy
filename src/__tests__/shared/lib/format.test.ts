import { describe, it, expect } from "vitest";
import { formatDuration, formatLessonDuration } from "@/shared/lib/format";

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
