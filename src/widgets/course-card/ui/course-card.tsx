"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Card, CardContent, Badge } from "@/shared/ui";
import { Link } from "@/i18n/navigation";
import type { CourseSummaryWithStats } from "@/entities/course";

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface CourseCardProps {
  course: CourseSummaryWithStats;
  /** Whether to show the description below the title. Defaults to true. */
  showDescription?: boolean;
}

export function CourseCard({ course, showDescription = true }: CourseCardProps) {
  const t = useTranslations("course");

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">{course.title}</span>
            </div>
          )}
          {/* Level badge (top-left) */}
          <Badge
            className={`absolute left-3 top-3 ${LEVEL_STYLES[course.level] ?? ""}`}
            variant="secondary"
          >
            {t(`level.${course.level}`)}
          </Badge>
          {/* Free badge (top-right) */}
          {course.isFree && (
            <Badge className="absolute right-3 top-3" variant="default">
              {t("free")}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
            {course.title}
          </h3>
          {showDescription && course.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
              {course.description}
            </p>
          )}
          {course.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span>{course.averageRating.toFixed(1)}</span>
              <span>({t("reviewCount", { count: course.reviewCount })})</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
