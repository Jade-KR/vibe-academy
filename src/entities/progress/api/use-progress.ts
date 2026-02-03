"use client";

import useSWR from "swr";
import type { CourseProgressWithLessons } from "../model/types";

/**
 * @deprecated This hook fetches from GET /api/progress?courseId=xxx which does not exist.
 * Use `useCurriculum` from `@/entities/progress` instead, which fetches from
 * the existing GET /api/learn/[courseSlug] endpoint and returns progress data
 * alongside the curriculum structure.
 *
 * @param courseId - The course UUID (not slug).
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
