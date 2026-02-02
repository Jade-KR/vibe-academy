"use client";

import useSWR from "swr";
import type { ChapterWithLessons } from "../model/types";

/**
 * SWR hook to fetch all lessons for a course, grouped by chapter.
 * Fetches GET /api/courses/[slug]/lessons.
 */
export function useLessons(courseSlug: string | undefined) {
  const { data, error, isLoading } = useSWR(
    courseSlug ? `/api/courses/${courseSlug}/lessons` : null,
  );

  return {
    chapters: (data?.data as ChapterWithLessons[]) ?? [],
    error,
    isLoading,
  };
}
