"use client";

import useSWR from "swr";
import type { EnrollmentCheckResponse } from "../model/types";

/**
 * SWR hook to check if the current user is enrolled in a course.
 * Fetches GET /api/enrollments/[courseId].
 * Returns mutate for revalidation after enrolling.
 */
export function useEnrollment(courseId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? `/api/enrollments/${courseId}` : null,
  );

  const result = (data?.data as EnrollmentCheckResponse) ?? null;

  return {
    enrolled: result?.enrolled ?? false,
    error,
    isLoading,
    mutate,
  };
}
