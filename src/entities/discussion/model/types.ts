import type { Discussion, Comment } from "@/db/schema";

/**
 * Discussion record as stored in DB.
 */
export type DiscussionRecord = Discussion;

/**
 * Discussion with joined user info and comment count.
 * Returned by GET /api/discussions?lessonId=xxx.
 */
export interface DiscussionWithUser extends Discussion {
  userName: string | null;
  userAvatarUrl: string | null;
  commentCount: number;
}

/**
 * Comment with joined user info.
 */
export interface CommentWithUser extends Comment {
  userName: string | null;
  userAvatarUrl: string | null;
}

/**
 * Full discussion detail with comments.
 * Returned by GET /api/discussions/[id].
 */
export interface DiscussionDetail extends DiscussionWithUser {
  comments: CommentWithUser[];
}

/**
 * Request body for POST /api/discussions.
 */
export interface CreateDiscussionRequest {
  lessonId: string;
  title: string;
  content: string;
}

/**
 * Request body for POST /api/discussions/[id]/comments.
 */
export interface CreateCommentRequest {
  discussionId: string;
  content: string;
}

/**
 * Query params for listing discussions.
 */
export interface DiscussionListParams {
  lessonId: string;
  page?: number;
  pageSize?: number;
}
