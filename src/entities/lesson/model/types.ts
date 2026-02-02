import type { Chapter, Lesson } from "@/db/schema";

/**
 * Lesson summary for curriculum list display.
 * Subset of Lesson fields shown in course chapter listings.
 */
export type LessonSummary = Pick<
  Lesson,
  "id" | "title" | "description" | "duration" | "isPreview" | "order"
>;

/**
 * A chapter with its ordered lessons.
 * Used in course curriculum views to group lessons by chapter.
 */
export interface ChapterWithLessons extends Chapter {
  lessons: Lesson[];
}

/**
 * Full lesson detail as returned by GET /api/lessons/[id].
 * Includes parent chapter and course context for breadcrumb navigation.
 */
export interface LessonDetail extends Lesson {
  chapterTitle: string;
  courseSlug: string;
  courseTitle: string;
}
