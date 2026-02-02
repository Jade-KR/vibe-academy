"use client";

import useSWR from "swr";
import type { DiscussionWithUser, DiscussionListParams } from "../model/types";
import type { PaginatedResponse } from "@/shared/types/api";

/**
 * SWR hook to fetch paginated discussions for a lesson.
 * Fetches GET /api/discussions?lessonId=xxx&page=1&pageSize=10.
 * Returns mutate for revalidation after creating a discussion.
 */
export function useDiscussions(params: DiscussionListParams | undefined) {
  const searchParams = new URLSearchParams();
  if (params?.lessonId) searchParams.set("lessonId", params.lessonId);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  const key = params?.lessonId ? `/api/discussions?${query}` : null;

  const { data, error, isLoading, mutate } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<DiscussionWithUser>) ?? null;

  return {
    discussions: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    pageSize: paginated?.pageSize ?? 10,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}
