"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { useCurriculum } from "@/entities/progress";
import type { CurriculumChapter } from "@/entities/progress";
import { findNextLesson, findPreviousLesson } from "@/features/progress";
import { CurriculumSidebar } from "./curriculum-sidebar";
import { LessonContent } from "./lesson-content";
import { MobileLearnTabs } from "./mobile-learn-tabs";
import { DiscussionPanel } from "@/widgets/discussion-panel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LearnLayoutProps {
  courseSlug: string;
  lessonId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findCurrentLesson(chapters: CurriculumChapter[], lessonId: string) {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LearnLayout({ courseSlug, lessonId }: LearnLayoutProps) {
  const t = useTranslations("learn");
  const router = useRouter();

  // --- Panel toggle state ---
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // --- Curriculum data ---
  const { course, chapters, progress, error, isLoading } = useCurriculum(courseSlug);

  // --- Enrollment check (403 redirect) ---
  useEffect(() => {
    if (error?.status === 403) {
      toast.error(t("notEnrolled"));
      router.push(`/courses/${courseSlug}`);
    }
  }, [error, courseSlug, router, t]);

  // --- Derived data ---
  const currentLesson = useMemo(() => findCurrentLesson(chapters, lessonId), [chapters, lessonId]);

  const nextLesson = useMemo(() => findNextLesson(chapters, lessonId), [chapters, lessonId]);

  const prevLesson = useMemo(() => findPreviousLesson(chapters, lessonId), [chapters, lessonId]);

  const toggleLeft = useCallback(() => setLeftOpen((p) => !p), []);
  const toggleRight = useCallback(() => setRightOpen((p) => !p), []);

  // --- Loading state ---
  if (isLoading && chapters.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden lg:flex w-[240px] shrink-0 flex-col border-r p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <Skeleton className="aspect-video w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="hidden lg:flex w-[320px] shrink-0 flex-col border-l p-4 space-y-4">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state (non-403) ---
  if (error && error.status !== 403) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-foreground">{t("notEnrolled")}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left panel toggle (desktop only) */}
      <div className="hidden lg:flex items-start pt-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleLeft}
          aria-label={leftOpen ? t("sidebar.curriculum") : t("sidebar.curriculum")}
        >
          {leftOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Left panel: Curriculum sidebar (desktop) */}
      {leftOpen && (
        <CurriculumSidebar
          courseSlug={courseSlug}
          course={course}
          chapters={chapters}
          progress={progress}
          currentLessonId={lessonId}
          className="hidden lg:flex w-[240px] shrink-0 transition-all duration-200"
        />
      )}

      {/* Center: Lesson content */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-16 lg:pb-0">
        <LessonContent
          courseSlug={courseSlug}
          lessonId={lessonId}
          currentLesson={currentLesson}
          nextLesson={nextLesson}
          prevLesson={prevLesson}
        />
      </div>

      {/* Right panel: Discussion (desktop) */}
      {rightOpen && (
        <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-l bg-background overflow-y-auto p-4 transition-all duration-200">
          <DiscussionPanel lessonId={lessonId} />
        </aside>
      )}

      {/* Right panel toggle (desktop only) */}
      <div className="hidden lg:flex items-start pt-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleRight}
          aria-label={t("sidebar.discussion")}
        >
          {rightOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile bottom tabs */}
      <MobileLearnTabs
        courseSlug={courseSlug}
        lessonId={lessonId}
        course={course}
        chapters={chapters}
        progress={progress}
        currentLessonId={lessonId}
      />
    </div>
  );
}
