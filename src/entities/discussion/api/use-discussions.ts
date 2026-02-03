"use client";

import useSWR from "swr";
import type { DiscussionListItem, DiscussionListParams } from "../model/types";
import type { PaginatedResponse } from "@/shared/types/api";

/**
 * SWR hook to fetch paginated discussions for a lesson.
 * Fetches GET /api/lessons/{lessonId}/discussions?page=N&pageSize=N.
 * Returns mutate for revalidation after creating a discussion.
 */
export function useDiscussions(params: DiscussionListParams | undefined) {
  const key = params?.lessonId
    ? `/api/lessons/${params.lessonId}/discussions?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<DiscussionListItem>) ?? null;

  return {
    discussions: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    pageSize: paginated?.pageSize ?? 20,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}
