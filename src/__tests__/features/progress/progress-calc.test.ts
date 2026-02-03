import { describe, it, expect } from "vitest";
import {
  calculateChapterProgress,
  calculateCourseProgress,
} from "@/features/progress/lib/progress-calc";

describe("calculateChapterProgress", () => {
  it("calculates progress for chapters with mixed completed/incomplete lessons", () => {
    const chapters = [
      {
        id: "ch-1",
        title: "Chapter 1",
        lessons: [{ completed: true }, { completed: true }, { completed: false }],
      },
      {
        id: "ch-2",
        title: "Chapter 2",
        lessons: [{ completed: false }, { completed: false }],
      },
    ];

    const result = calculateChapterProgress(chapters);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      chapterId: "ch-1",
      chapterTitle: "Chapter 1",
      completedLessons: 2,
      totalLessons: 3,
      percent: 67,
    });
    expect(result[1]).toEqual({
      chapterId: "ch-2",
      chapterTitle: "Chapter 2",
      completedLessons: 0,
      totalLessons: 2,
      percent: 0,
    });
  });

  it("returns 100% for a fully completed chapter", () => {
    const chapters = [
      {
        id: "ch-1",
        title: "Done Chapter",
        lessons: [{ completed: true }, { completed: true }],
      },
    ];

    const result = calculateChapterProgress(chapters);

    expect(result[0].percent).toBe(100);
    expect(result[0].completedLessons).toBe(2);
  });

  it("handles empty chapters (zero lessons) with 0%", () => {
    const chapters = [
      {
        id: "ch-empty",
        title: "Empty Chapter",
        lessons: [],
      },
    ];

    const result = calculateChapterProgress(chapters);

    expect(result[0]).toEqual({
      chapterId: "ch-empty",
      chapterTitle: "Empty Chapter",
      completedLessons: 0,
      totalLessons: 0,
      percent: 0,
    });
  });

  it("returns empty array for empty chapters input", () => {
    const result = calculateChapterProgress([]);
    expect(result).toEqual([]);
  });
});

describe("calculateCourseProgress", () => {
  it("returns correct percentages across multiple chapters", () => {
    const chapters = [
      { lessons: [{ completed: true }, { completed: true }] },
      { lessons: [{ completed: true }, { completed: false }, { completed: false }] },
    ];

    const result = calculateCourseProgress(chapters);

    expect(result).toEqual({
      totalLessons: 5,
      completedLessons: 3,
      percent: 60,
    });
  });

  it("returns 0% with zero lessons", () => {
    const result = calculateCourseProgress([]);
    expect(result).toEqual({
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
    });
  });

  it("returns 0% when chapters have no lessons", () => {
    const chapters = [{ lessons: [] }, { lessons: [] }];
    const result = calculateCourseProgress(chapters);
    expect(result.percent).toBe(0);
    expect(result.totalLessons).toBe(0);
  });

  it("returns 100% when all lessons are completed", () => {
    const chapters = [
      { lessons: [{ completed: true }, { completed: true }] },
      { lessons: [{ completed: true }] },
    ];

    const result = calculateCourseProgress(chapters);

    expect(result).toEqual({
      totalLessons: 3,
      completedLessons: 3,
      percent: 100,
    });
  });

  it("rounds percentage correctly", () => {
    // 1 of 3 = 33.33... -> 33
    const chapters = [
      { lessons: [{ completed: true }, { completed: false }, { completed: false }] },
    ];

    const result = calculateCourseProgress(chapters);
    expect(result.percent).toBe(33);
  });
});
