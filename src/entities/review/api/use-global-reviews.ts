"use client";

import useSWR from "swr";
import type { PaginatedResponse } from "@/shared/types/api";

/**
 * Review item from the global reviews endpoint (GET /api/reviews).
 * Includes user and course info for display without additional fetches.
 */
export interface GlobalReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
  course: {
    title: string;
    slug: string;
  };
}

/**
 * SWR hook to fetch global reviews (not per-course).
 * Fetches GET /api/reviews?page=1&pageSize=N (no courseId filter).
 * Used by the landing page review highlights section.
 */
export function useGlobalReviews(pageSize: number = 6) {
  const key = `/api/reviews?page=1&pageSize=${pageSize}`;

  const { data, error, isLoading } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<GlobalReviewItem>) ?? null;

  return {
    reviews: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
  };
}
