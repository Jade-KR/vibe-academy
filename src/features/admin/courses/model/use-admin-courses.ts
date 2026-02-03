"use client";

import useSWR from "swr";

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  level: string;
  category: string | null;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  chapterCount: number;
  lessonCount: number;
}

export function useAdminCourses() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/courses");
  return {
    courses: (data?.data?.items as AdminCourseSummary[]) ?? [],
    total: (data?.data?.total as number) ?? 0,
    error,
    isLoading,
    mutate,
  };
}
