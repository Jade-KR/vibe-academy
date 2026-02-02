"use client";

import useSWR from "swr";
import type { LessonDetail } from "../model/types";

/**
 * SWR hook to fetch a single lesson detail.
 * Fetches GET /api/lessons/[id].
 * Server-side enrollment check determines if video URL is included.
 */
export function useLesson(lessonId: string | undefined) {
  const { data, error, isLoading } = useSWR(lessonId ? `/api/lessons/${lessonId}` : null);

  return {
    lesson: (data?.data as LessonDetail) ?? null,
    error,
    isLoading,
  };
}
