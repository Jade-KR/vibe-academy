"use client";

import useSWR from "swr";
import type { EnrollmentCheckResponse } from "../model/types";

/**
 * SWR hook to check if the current user is enrolled in a course.
 * Fetches GET /api/enrollments/check?courseId=xxx.
 * Returns mutate for revalidation after enrolling.
 */
export function useEnrollment(courseId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? `/api/enrollments/check?courseId=${courseId}` : null,
  );

  const result = (data?.data as EnrollmentCheckResponse) ?? null;

  return {
    enrolled: result?.enrolled ?? false,
    error,
    isLoading,
    mutate,
  };
}
