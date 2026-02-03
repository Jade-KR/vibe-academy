"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Progress, Skeleton } from "@/shared/ui";
import { formatLessonDuration } from "@/shared/lib/format";
import type { CurriculumChapter, CurriculumProgress, CurriculumCourse } from "@/entities/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurriculumSidebarProps {
  courseSlug: string;
  course: CurriculumCourse | null;
  chapters: CurriculumChapter[];
  progress: CurriculumProgress | null;
  currentLessonId: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getChapterProgress(chapter: CurriculumChapter): { completed: number; total: number } {
  const total = chapter.lessons.length;
  const completed = chapter.lessons.filter((l) => l.completed).length;
  return { completed, total };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CurriculumSidebar({
  courseSlug,
  course,
  chapters,
  progress,
  currentLessonId,
  className,
}: CurriculumSidebarProps) {
  const t = useTranslations("learn");

  // Find which chapter contains the current lesson so it can be default-expanded
  const defaultExpandedChapter = useMemo(() => {
    for (const chapter of chapters) {
      if (chapter.lessons.some((l) => l.id === currentLessonId)) {
        return chapter.id;
      }
    }
    return chapters[0]?.id ?? "";
  }, [chapters, currentLessonId]);

  return (
    <aside className={cn("flex flex-col border-r bg-background", className)}>
      {/* Header: Course title + overall progress */}
      <div className="shrink-0 border-b p-4">
        <h2 className="text-sm font-semibold text-foreground truncate">
          {course?.title ?? <Skeleton className="h-4 w-32" />}
        </h2>
        {progress ? (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("overallProgress")}</span>
              <span>{t("progressPercent", { percent: progress.percent })}</span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
          </div>
        ) : (
          <Skeleton className="mt-3 h-4 w-full" />
        )}
      </div>

      {/* Scrollable chapter list */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={[defaultExpandedChapter]} className="w-full">
            {chapters.map((chapter) => {
              const chapterProg = getChapterProgress(chapter);
              return (
                <AccordionItem key={chapter.id} value={chapter.id} className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex flex-col items-start gap-0.5 text-left">
                      <span className="text-xs font-medium text-foreground truncate max-w-[170px]">
                        {chapter.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {chapterProg.completed}/{chapterProg.total}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-1">
                    <ul className="space-y-0.5">
                      {chapter.lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/learn/${courseSlug}/${lesson.id}`}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 text-xs transition-colors",
                                "hover:bg-muted/50",
                                isCurrent && "bg-primary/10 border-l-2 border-primary",
                                !isCurrent && "border-l-2 border-transparent",
                              )}
                              aria-current={isCurrent ? "page" : undefined}
                            >
                              {lesson.completed ? (
                                <CheckCircle2
                                  className="h-3.5 w-3.5 shrink-0 text-primary"
                                  aria-label={t("completed")}
                                />
                              ) : (
                                <Circle
                                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                  aria-label={t("incomplete")}
                                />
                              )}
                              <span className="flex-1 truncate text-foreground">
                                {lesson.title}
                              </span>
                              {lesson.duration != null && (
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                  {formatLessonDuration(lesson.duration)}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </aside>
  );
}
