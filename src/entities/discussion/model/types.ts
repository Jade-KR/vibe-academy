/**
 * Nested user object as returned by API (discussions and comments).
 */
export interface DiscussionUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Discussion list item as returned by GET /api/lessons/{lessonId}/discussions.
 */
export interface DiscussionListItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: DiscussionUser;
  commentCount: number;
}

/**
 * Comment list item as returned by GET /api/discussions/{discussionId}/comments.
 */
export interface CommentListItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: DiscussionUser;
}

/**
 * Request body for POST /api/lessons/{lessonId}/discussions.
 */
export interface CreateDiscussionRequest {
  title: string;
  content: string;
}

/**
 * Request body for POST /api/discussions/{discussionId}/comments.
 */
export interface CreateCommentRequest {
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
