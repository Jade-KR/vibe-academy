"use client";

import useSWR from "swr";
import type { CourseDetail } from "../model/types";

/**
 * SWR hook to fetch a single course detail by slug.
 * Fetches GET /api/courses/[slug].
 * Pass undefined slug to disable the request (conditional fetching).
 */
export function useCourse(slug: string | undefined) {
  const { data, error, isLoading } = useSWR(slug ? `/api/courses/${slug}` : null);

  return {
    course: (data?.data as CourseDetail) ?? null,
    error,
    isLoading,
  };
}
