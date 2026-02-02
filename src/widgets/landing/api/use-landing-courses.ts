"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { CourseSummaryWithStats } from "../model/types";
import { FEATURED_COURSES_COUNT, LANDING_CATEGORIES } from "../config";

/**
 * SWR hook to fetch all published courses for the landing page.
 * Returns featured courses (top N by rating) and grouped by category.
 */
export function useLandingCourses() {
  const { data, error, isLoading } = useSWR("/api/courses");

  const allCourses: CourseSummaryWithStats[] = useMemo(
    () => (data?.data as CourseSummaryWithStats[]) ?? [],
    [data],
  );

  // Featured: top N courses by averageRating (descending), then by reviewCount
  const featuredCourses = useMemo(
    () =>
      [...allCourses]
        .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount)
        .slice(0, FEATURED_COURSES_COUNT),
    [allCourses],
  );

  // Group by category for the category sections
  const coursesByCategory = useMemo(() => {
    const map = new Map<string, CourseSummaryWithStats[]>();
    for (const cat of LANDING_CATEGORIES) {
      const courses = allCourses.filter((c) => c.category === cat.key);
      if (courses.length > 0) {
        map.set(cat.key, courses);
      }
    }
    return map;
  }, [allCourses]);

  return {
    allCourses,
    featuredCourses,
    coursesByCategory,
    error,
    isLoading,
  };
}
