import type { Enrollment } from "@/db/schema";

/**
 * Enrollment record as stored in DB.
 */
export type EnrollmentRecord = Enrollment;

/**
 * Enrollment with joined course info and progress.
 * Used in the "My Courses" dashboard listing.
 * Returned by GET /api/enrollments.
 */
export interface EnrollmentWithCourse extends Enrollment {
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl: string | null;
  progressPercent: number;
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
