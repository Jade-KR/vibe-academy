"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { Button } from "@/shared/ui";
import { Link } from "@/i18n/navigation";
import { useEnrollments } from "@/entities/enrollment";
import { EnrolledCourseCard, EnrolledCourseCardSkeleton } from "./enrolled-course-card";

export function MyCoursesSection() {
  const t = useTranslations("dashboard.myCourses");
  const { enrollments, isLoading } = useEnrollments();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <EnrolledCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-12 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-medium text-foreground">{t("empty")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Button asChild className="mt-6">
            <Link href="/courses">{t("browseCourses")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </section>
  );
}
