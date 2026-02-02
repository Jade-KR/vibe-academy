"use client";

import useSWR from "swr";
import type { EnrollmentWithCourse } from "../model/types";

/**
 * SWR hook to fetch the current user's enrollments.
 * Fetches GET /api/enrollments.
 * Used in the "My Courses" dashboard.
 */
export function useEnrollments() {
  const { data, error, isLoading, mutate } = useSWR("/api/enrollments");

  return {
    enrollments: (data?.data as EnrollmentWithCourse[]) ?? [],
    error,
    isLoading,
    mutate,
  };
}
