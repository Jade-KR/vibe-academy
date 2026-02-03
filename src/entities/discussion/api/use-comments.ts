"use client";

import useSWR from "swr";
import type { CommentListItem } from "../model/types";

/**
 * SWR hook to fetch comments for a discussion.
 * Fetches GET /api/discussions/{discussionId}/comments.
 * Returns mutate for revalidation after creating/editing/deleting a comment.
 */
export function useComments(discussionId: string | null) {
  const key = discussionId ? `/api/discussions/${discussionId}/comments` : null;

  const { data, error, isLoading, mutate } = useSWR(key);

  return {
    comments: (data?.data as CommentListItem[]) ?? [],
    error,
    isLoading,
    mutate,
  };
}
