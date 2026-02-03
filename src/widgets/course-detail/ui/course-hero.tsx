"use client";

import { useTranslations } from "next-intl";
import { Star, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/shared/ui";
import { formatDuration } from "@/shared/lib/format";
import type { CourseDetail } from "@/entities/course";

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface CourseHeroProps {
  course: CourseDetail & { reviewCount: number; averageRating: number };
}

export function CourseHero({ course }: CourseHeroProps) {
  const t = useTranslations("course");

  return (
    <section className="relative overflow-hidden bg-muted/50">
      {/* Optional background thumbnail with gradient overlay */}
      {course.thumbnailUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-5"
          style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
          aria-hidden="true"
        />
      ) : null}

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge className={LEVEL_STYLES[course.level] ?? ""} variant="secondary">
            {t(`level.${course.level}`)}
          </Badge>
          {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
          {course.isFree ? <Badge variant="default">{t("free")}</Badge> : null}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {course.title}
        </h1>

        {/* Description */}
        {course.description ? (
          <p className="mb-6 max-w-3xl text-base text-muted-foreground sm:text-lg">
            {course.description}
          </p>
        ) : null}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground sm:gap-6">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>{t("lessons", { count: course.totalLessons })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
          {course.averageRating > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span>{course.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground/70">
                ({t("reviewCount", { count: course.reviewCount })})
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
