import type { Progress } from "@/db/schema";

/**
 * Progress record as stored in DB.
 */
export type ProgressRecord = Progress;

/**
 * Request body for PATCH /api/progress.
 * Updates video position and/or completion status for a lesson.
 */
export interface UpdateProgressRequest {
  lessonId: string;
  completed?: boolean;
  position?: number;
}

/**
 * Aggregated course-level progress.
 */
export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

/**
 * Progress data for a single lesson.
 */
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  position: number;
}

/**
 * Full progress response for a course.
 * Returned by GET /api/progress?courseId=xxx.
 */
export interface CourseProgressWithLessons {
  courseProgress: CourseProgress;
  lessons: LessonProgress[];
}
