import { describe, it, expect } from "vitest";
import { findPreviousLesson } from "@/features/progress/lib/find-previous-lesson";

const chapters = [
  {
    title: "Chapter 1",
    lessons: [
      { id: "l-1", title: "Lesson 1" },
      { id: "l-2", title: "Lesson 2" },
    ],
  },
  {
    title: "Chapter 2",
    lessons: [
      { id: "l-3", title: "Lesson 3" },
      { id: "l-4", title: "Lesson 4" },
    ],
  },
  {
    title: "Chapter 3",
    lessons: [{ id: "l-5", title: "Lesson 5" }],
  },
];

describe("findPreviousLesson", () => {
  it("returns the previous lesson in the same chapter", () => {
    const result = findPreviousLesson(chapters, "l-2");

    expect(result).toEqual({
      lessonId: "l-1",
      lessonTitle: "Lesson 1",
      chapterTitle: "Chapter 1",
    });
  });

  it("returns the last lesson of the previous chapter when current is first in chapter", () => {
    const result = findPreviousLesson(chapters, "l-3");

    expect(result).toEqual({
      lessonId: "l-2",
      lessonTitle: "Lesson 2",
      chapterTitle: "Chapter 1",
    });
  });

  it("returns null when the current lesson is the very first one", () => {
    const result = findPreviousLesson(chapters, "l-1");
    expect(result).toBeNull();
  });

  it("handles single-lesson chapters", () => {
    const result = findPreviousLesson(chapters, "l-5");

    expect(result).toEqual({
      lessonId: "l-4",
      lessonTitle: "Lesson 4",
      chapterTitle: "Chapter 2",
    });
  });

  it("returns null for a non-existent lesson ID", () => {
    const result = findPreviousLesson(chapters, "l-nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for empty chapters", () => {
    const result = findPreviousLesson([], "l-1");
    expect(result).toBeNull();
  });

  it("handles a course with a single lesson", () => {
    const singleLesson = [
      {
        title: "Only Chapter",
        lessons: [{ id: "only", title: "Only Lesson" }],
      },
    ];
    const result = findPreviousLesson(singleLesson, "only");
    expect(result).toBeNull();
  });
});
