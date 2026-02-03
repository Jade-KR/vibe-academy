"use client";

import useSWR from "swr";
import type { CourseDetail } from "@/entities/course";

export function useAdminCourse(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/admin/courses/${id}` : null);
  return {
    course: (data?.data as CourseDetail) ?? null,
    error,
    isLoading,
    mutate,
  };
}
