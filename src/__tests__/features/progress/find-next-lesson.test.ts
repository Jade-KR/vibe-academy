import { describe, it, expect } from "vitest";
import { findNextLesson } from "@/features/progress/lib/find-next-lesson";

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

describe("findNextLesson", () => {
  it("returns the next lesson in the same chapter", () => {
    const result = findNextLesson(chapters, "l-1");

    expect(result).toEqual({
      lessonId: "l-2",
      lessonTitle: "Lesson 2",
      chapterTitle: "Chapter 1",
    });
  });

  it("returns the first lesson of the next chapter when current is last in chapter", () => {
    const result = findNextLesson(chapters, "l-2");

    expect(result).toEqual({
      lessonId: "l-3",
      lessonTitle: "Lesson 3",
      chapterTitle: "Chapter 2",
    });
  });

  it("returns null when the current lesson is the very last one", () => {
    const result = findNextLesson(chapters, "l-5");
    expect(result).toBeNull();
  });

  it("handles single-lesson chapters", () => {
    const result = findNextLesson(chapters, "l-4");

    expect(result).toEqual({
      lessonId: "l-5",
      lessonTitle: "Lesson 5",
      chapterTitle: "Chapter 3",
    });
  });

  it("returns null for a non-existent lesson ID", () => {
    const result = findNextLesson(chapters, "l-nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for empty chapters", () => {
    const result = findNextLesson([], "l-1");
    expect(result).toBeNull();
  });

  it("handles a course with a single lesson", () => {
    const singleLesson = [
      {
        title: "Only Chapter",
        lessons: [{ id: "only", title: "Only Lesson" }],
      },
    ];
    const result = findNextLesson(singleLesson, "only");
    expect(result).toBeNull();
  });
});
