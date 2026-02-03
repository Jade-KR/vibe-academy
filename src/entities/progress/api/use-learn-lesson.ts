"use client";

import useSWR from "swr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LearnLessonData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  isPreview: boolean;
  order: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * SWR hook to fetch a single lesson detail for the learn page.
 * Endpoint: GET /api/learn/[courseSlug]/lessons/[lessonId]
 *
 * Returns the lesson with a presigned video URL (if available).
 *
 * @param courseSlug - The course slug (URL-friendly identifier)
 * @param lessonId - The lesson ID
 */
export function useLearnLesson(courseSlug: string | undefined, lessonId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    courseSlug && lessonId ? `/api/learn/${courseSlug}/lessons/${lessonId}` : null,
  );

  const lesson = (data?.data as LearnLessonData) ?? null;

  return {
    lesson,
    error,
    isLoading,
    mutate,
  };
}
