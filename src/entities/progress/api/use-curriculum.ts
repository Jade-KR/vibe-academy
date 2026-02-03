"use client";

import useSWR from "swr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurriculumLesson {
  id: string;
  title: string;
  duration: number | null;
  isPreview: boolean;
  order: number;
  completed: boolean;
  position: number;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

export interface CurriculumCourse {
  id: string;
  title: string;
  slug: string;
}

export interface CurriculumProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface CurriculumData {
  course: CurriculumCourse;
  chapters: CurriculumChapter[];
  progress: CurriculumProgress;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * SWR hook to fetch the curriculum for a course (GET /api/learn/[courseSlug]).
 * Returns chapter/lesson structure with per-lesson progress (completed, position)
 * and course-level progress summary.
 *
 * This replaces the broken `useProgress` hook that referenced a non-existent endpoint.
 *
 * @param courseSlug - The course slug (URL-friendly identifier)
 */
export function useCurriculum(courseSlug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(courseSlug ? `/api/learn/${courseSlug}` : null);

  const curriculum = (data?.data as CurriculumData) ?? null;

  return {
    course: curriculum?.course ?? null,
    chapters: curriculum?.chapters ?? [],
    progress: curriculum?.progress ?? null,
    error,
    isLoading,
    mutate,
  };
}
