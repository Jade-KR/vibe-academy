"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { CourseSummaryWithStats } from "@/entities/course";
import { COURSE_CATEGORIES } from "@/shared/config/categories";

/**
 * SWR hook to fetch all published courses and group by category.
 * Used by the /courses listing page.
 */
export function useAllCourses() {
  const { data, error, isLoading } = useSWR("/api/courses");

  const allCourses: CourseSummaryWithStats[] = useMemo(
    () => (data?.data as CourseSummaryWithStats[]) ?? [],
    [data],
  );

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, CourseSummaryWithStats[]>();
    for (const cat of COURSE_CATEGORIES) {
      const courses = allCourses.filter((c) => c.category === cat.key);
      if (courses.length > 0) {
        map.set(cat.key, courses);
      }
    }
    return map;
  }, [allCourses]);

  return {
    allCourses,
    coursesByCategory,
    error,
    isLoading,
  };
}
