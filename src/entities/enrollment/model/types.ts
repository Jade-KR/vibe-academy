import type { Enrollment } from "@/db/schema";

/**
 * Enrollment record as stored in DB.
 */
export type EnrollmentRecord = Enrollment;

/**
 * Enrollment with joined course info and progress.
 * Matches the actual shape returned by GET /api/enrollments.
 * Used in the "My Courses" dashboard listing.
 */
export interface EnrollmentWithCourse {
  id: string;
  purchasedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    level: string;
  };
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Request body for POST /api/enrollments.
 */
export interface EnrollRequest {
  courseId: string;
}

/**
 * Response data for GET /api/enrollments/check.
 */
export interface EnrollmentCheckResponse {
  enrolled: boolean;
}
