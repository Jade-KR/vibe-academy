"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/shared/ui";
import { LandingCourseCard } from "./landing-course-card";
import { LANDING_CATEGORIES } from "../config";
import type { CourseSummaryWithStats } from "../model/types";

interface CategoryCoursesSectionProps {
  coursesByCategory: Map<string, CourseSummaryWithStats[]>;
  isLoading: boolean;
}

export function CategoryCoursesSection({
  coursesByCategory,
  isLoading,
}: CategoryCoursesSectionProps) {
  const t = useTranslations("landing");

  if (isLoading) {
    return (
      <section className="container py-16 md:py-24">
        <div className="space-y-16">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-6 h-8 w-48" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Filter to only categories that have courses
  const visibleCategories = LANDING_CATEGORIES.filter(
    (cat) => (coursesByCategory.get(cat.key)?.length ?? 0) > 0,
  );

  if (visibleCategories.length === 0) return null;

  return (
    <section className="container py-16 md:py-24">
      <div className="space-y-16">
        {visibleCategories.map((cat) => {
          const courses = coursesByCategory.get(cat.key) ?? [];
          return (
            <div key={cat.key}>
              <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t(cat.labelKey)}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <LandingCourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
