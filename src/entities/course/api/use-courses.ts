"use client";

import useSWR from "swr";
import type { CourseSummary, CourseListParams } from "../model/types";
import type { PaginatedResponse } from "@/shared/types/api";

/**
 * SWR hook to fetch a paginated list of published courses.
 * Fetches GET /api/courses with optional query params.
 */
export function useCourses(params?: CourseListParams) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.level) searchParams.set("level", params.level);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  const key = `/api/courses${query ? `?${query}` : ""}`;

  const { data, error, isLoading } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<CourseSummary>) ?? null;

  return {
    courses: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    pageSize: paginated?.pageSize ?? 12,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
  };
}
