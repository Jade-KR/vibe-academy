"use client";

import useSWR from "swr";
import type { ReviewWithUser, ReviewListParams } from "../model/types";
import type { PaginatedResponse } from "@/shared/types/api";

/**
 * SWR hook to fetch paginated reviews for a course.
 * Fetches GET /api/reviews?courseId=xxx&page=1&pageSize=10.
 * Returns mutate for revalidation after creating/updating/deleting a review.
 *
 * Note: ReviewListParams uses courseId (not courseSlug) because the reviews table
 * references courses by UUID. Callers should resolve the slug to an ID before use.
 */
export function useReviews(params: ReviewListParams | undefined) {
  const searchParams = new URLSearchParams();
  if (params?.courseId) searchParams.set("courseId", params.courseId);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  const key = params?.courseId ? `/api/reviews?${query}` : null;

  const { data, error, isLoading, mutate } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<ReviewWithUser>) ?? null;

  return {
    reviews: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    pageSize: paginated?.pageSize ?? 10,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}
