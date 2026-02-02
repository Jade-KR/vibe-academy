import type { Review } from "@/db/schema";

/**
 * Review record as stored in DB.
 */
export type ReviewRecord = Review;

/**
 * Review with joined user info for display.
 * Returned by GET /api/reviews?courseId=xxx.
 */
export interface ReviewWithUser extends Review {
  userName: string | null;
  userAvatarUrl: string | null;
}

/**
 * Request body for POST /api/reviews.
 */
export interface CreateReviewRequest {
  courseId: string;
  rating: number;
  title?: string;
  content: string;
}

/**
 * Request body for PATCH /api/reviews/[id].
 */
export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
}

/**
 * Query params for listing reviews.
 */
export interface ReviewListParams {
  courseId: string;
  page?: number;
  pageSize?: number;
}
