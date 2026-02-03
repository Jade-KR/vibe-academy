"use client";

import useSWR from "swr";
import type { PaginatedResponse } from "@/shared/types/api";

interface CourseReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
}

/**
 * SWR hook to fetch paginated reviews for a course by slug.
 * Fetches GET /api/courses/[slug]/reviews.
 */
export function useCourseReviews(slug: string | undefined, page = 1, pageSize = 5) {
  const key = slug ? `/api/courses/${slug}/reviews?page=${page}&pageSize=${pageSize}` : null;
  const { data, error, isLoading, mutate } = useSWR(key);
  const paginated = (data?.data as PaginatedResponse<CourseReviewItem>) ?? null;

  return {
    reviews: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}

export type { CourseReviewItem };
