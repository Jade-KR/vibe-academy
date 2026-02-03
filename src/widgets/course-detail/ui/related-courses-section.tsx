"use client";

import { useTranslations } from "next-intl";
import { useCourses, type CourseSummaryWithStats } from "@/entities/course";
import { CourseCard } from "@/widgets/course-card";
import { Separator } from "@/shared/ui";

interface RelatedCoursesSectionProps {
  category: string | null;
  currentCourseId: string;
}

export function RelatedCoursesSection({ category, currentCourseId }: RelatedCoursesSectionProps) {
  const t = useTranslations("course");
  const { courses, isLoading } = useCourses(category ? { category } : undefined);

  if (!category) return null;

  // Filter out the current course and limit to 3
  const relatedCourses = courses
    .filter((c) => c.id !== currentCourseId)
    .slice(0, 3) as unknown as CourseSummaryWithStats[];

  if (isLoading || relatedCourses.length === 0) return null;

  return (
    <section className="mb-8">
      <Separator className="mb-8" />
      <h2 className="mb-4 text-xl font-semibold text-foreground">{t("relatedCourses")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedCourses.map((course) => (
          <CourseCard key={course.id} course={course} showDescription={false} />
        ))}
      </div>
    </section>
  );
}
