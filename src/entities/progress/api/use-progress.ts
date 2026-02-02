"use client";

import useSWR from "swr";
import type { CourseProgressWithLessons } from "../model/types";

/**
 * SWR hook to fetch progress for a course.
 * Fetches GET /api/progress?courseId=xxx.
 * Returns mutate for revalidation after updating lesson progress.
 *
 * @param courseId - The course UUID (not slug). The progress table uses courseId
 *   as the foreign key, so querying by courseId avoids an extra slug-to-id lookup.
 */
export function useProgress(courseId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? `/api/progress?courseId=${courseId}` : null,
  );

  const result = (data?.data as CourseProgressWithLessons) ?? null;

  return {
    courseProgress: result?.courseProgress ?? null,
    lessons: result?.lessons ?? [],
    error,
    isLoading,
    mutate,
  };
}
