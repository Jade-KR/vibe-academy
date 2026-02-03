"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, Skeleton } from "@/shared/ui";
import { useLearnLesson } from "@/entities/progress";
import type { CurriculumLesson } from "@/entities/progress";
import { useProgressSaver } from "@/features/progress";
import type { NextLessonResult } from "@/features/progress";
import type { PreviousLessonResult } from "@/features/progress";

// Dynamic import for VideoPlayer (SSR: false -- HLS.js needs browser APIs)
const VideoPlayer = dynamic(() => import("@/widgets/video-player").then((mod) => mod.VideoPlayer), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse bg-muted" />,
});

// Dynamic import for MDX renderer (heavy -- rehype-pretty-code ~40KB)
const LessonMdxRenderer = dynamic(
  () => import("./lesson-mdx-renderer").then((mod) => mod.LessonMdxRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonContentProps {
  courseSlug: string;
  lessonId: string;
  currentLesson?: CurriculumLesson;
  nextLesson: NextLessonResult | null;
  prevLesson: PreviousLessonResult | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonContent({
  courseSlug,
  lessonId,
  currentLesson,
  nextLesson,
  prevLesson,
}: LessonContentProps) {
  const t = useTranslations("learn");
  const router = useRouter();

  // --- Lesson data ---
  const { lesson, error, isLoading } = useLearnLesson(courseSlug, lessonId);

  // --- Progress tracking ---
  const { handleTimeUpdate, handleEnded, manualComplete, isCompleted, isSaving } = useProgressSaver(
    {
      lessonId,
      courseSlug,
      initialPosition: currentLesson?.position ?? 0,
      initialCompleted: currentLesson?.completed ?? false,
    },
  );

  // --- "Complete & Next" handler ---
  const handleCompleteAndNext = useCallback(async () => {
    try {
      await manualComplete();
      if (nextLesson) {
        router.push(`/learn/${courseSlug}/${nextLesson.lessonId}`);
      }
    } catch {
      // manualComplete handles its own error reporting; navigation is simply skipped on failure
    }
  }, [manualComplete, nextLesson, courseSlug, router]);

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <div className="aspect-video w-full animate-pulse bg-muted" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">{t("errorLoadingLesson")}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="flex flex-col">
      {/* Video area */}
      {lesson.videoUrl ? (
        <div className="aspect-video w-full bg-black">
          <VideoPlayer
            src={lesson.videoUrl}
            startAt={currentLesson?.position ?? 0}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
      ) : null}

      {/* Content area */}
      <div className="p-6 space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{lesson.title}</h1>

        {/* MDX Description */}
        {lesson.description ? <LessonMdxRenderer source={lesson.description} /> : null}

        {/* Navigation bar */}
        <nav className="flex items-center justify-between border-t pt-4">
          {/* Previous button */}
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/learn/${courseSlug}/${prevLesson.lessonId}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t("previousLesson")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("previousLesson")}
            </Button>
          )}

          {/* Complete & Next */}
          <Button onClick={handleCompleteAndNext} disabled={isCompleted || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isCompleted ? t("completed") : t("markComplete")}
          </Button>

          {/* Next button */}
          {nextLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/learn/${courseSlug}/${nextLesson.lessonId}`}>
                {t("nextLesson")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              {t("nextLesson")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
}
