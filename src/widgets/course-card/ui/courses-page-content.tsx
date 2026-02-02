"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { COURSE_CATEGORIES } from "@/shared/config/categories";
import { CourseCard } from "./course-card";
import { CourseCardSkeleton } from "./course-card-skeleton";
import { useAllCourses } from "../api/use-all-courses";

export function CoursesPageContent() {
  const t = useTranslations("course");
  const { allCourses, coursesByCategory, isLoading } = useAllCourses();

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mb-10">
          <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-16">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="mb-6 h-7 w-40 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <CourseCardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (allCourses.length === 0) {
    return (
      <div className="container py-12 md:py-16">
        <h1 className="mb-10 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("allCourses")}
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-lg font-medium text-muted-foreground">{t("empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t("emptyDescription")}</p>
        </div>
      </div>
    );
  }

  // Filter to only categories that have courses
  const visibleCategories = COURSE_CATEGORIES.filter(
    (cat) => (coursesByCategory.get(cat.key)?.length ?? 0) > 0,
  );

  return (
    <div className="container py-12 md:py-16">
      <h1 className="mb-10 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t("allCourses")}
      </h1>
      <div className="space-y-16">
        {visibleCategories.map((cat) => {
          const courses = coursesByCategory.get(cat.key) ?? [];
          return (
            <section key={cat.key}>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
                {t(cat.labelKey)}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
