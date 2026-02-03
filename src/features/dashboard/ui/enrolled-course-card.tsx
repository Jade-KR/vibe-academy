"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { Card, CardContent, Badge, Button, Skeleton, Progress } from "@/shared/ui";
import { Link } from "@/i18n/navigation";
import type { EnrollmentWithCourse } from "@/entities/enrollment";

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface EnrolledCourseCardProps {
  enrollment: EnrollmentWithCourse;
}

export function EnrolledCourseCard({ enrollment }: EnrolledCourseCardProps) {
  const tMyCourses = useTranslations("dashboard.myCourses");
  const tCourse = useTranslations("course");
  const tLearn = useTranslations("learn");

  const { course, progressPercent, completedLessons, totalLessons, purchasedAt } = enrollment;

  const formattedDate = new Date(purchasedAt).toLocaleDateString();

  return (
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <BookOpen className="h-8 w-8" aria-hidden="true" />
            <span className="px-4 text-center text-sm">{course.title}</span>
          </div>
        )}
        {/* Level badge */}
        <Badge
          className={`absolute left-3 top-3 ${LEVEL_STYLES[course.level] ?? ""}`}
          variant="secondary"
        >
          {tCourse(`level.${course.level}`)}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="space-y-3 p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">{course.title}</h3>

        <Progress value={progressPercent} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedLessons}/{totalLessons} {tCourse("lessons", { count: totalLessons })}
          </span>
          <span>{tLearn("progressPercent", { percent: progressPercent })}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          {tMyCourses("lastStudied", { date: formattedDate })}
        </p>

        <Button asChild size="sm" className="w-full">
          <Link href={`/learn/${course.slug}`}>{tMyCourses("continueLearning")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function EnrolledCourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full rounded-none" />
      {/* Content skeleton */}
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
