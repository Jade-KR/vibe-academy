import type { Course, Chapter, Lesson } from "@/db/schema";

/**
 * Course difficulty level.
 * Must match DB `course_level` enum values from `src/db/schema/enums.ts`.
 */
export type CourseLevel = "beginner" | "intermediate" | "advanced";

/**
 * Course summary for list/card views.
 * Subset of Course fields used in paginated course listings.
 */
export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  level: CourseLevel;
  category: string | null;
  thumbnailUrl: string | null;
  isFree: boolean;
  isPublished: boolean;
}

/**
 * Full course detail with nested chapters and lessons.
 * Returned by GET /api/courses/[slug].
 */
export interface CourseDetail extends Course {
  chapters: (Chapter & { lessons: Lesson[] })[];
  totalLessons: number;
  totalDuration: number;
}

/**
 * Query params for listing courses.
 */
export interface CourseListParams {
  category?: string;
  level?: CourseLevel;
  page?: number;
  pageSize?: number;
}
