"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui";
import { DiscussionPanel } from "@/widgets/discussion-panel";
import { CurriculumSidebar } from "./curriculum-sidebar";
import type { CurriculumChapter, CurriculumProgress, CurriculumCourse } from "@/entities/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MobileLearnTabsProps {
  courseSlug: string;
  lessonId: string;
  course: CurriculumCourse | null;
  chapters: CurriculumChapter[];
  progress: CurriculumProgress | null;
  currentLessonId: string;
}

type SheetTab = "curriculum" | "discussion" | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileLearnTabs({
  courseSlug,
  lessonId,
  course,
  chapters,
  progress,
  currentLessonId,
}: MobileLearnTabsProps) {
  const t = useTranslations("learn");
  const [activeTab, setActiveTab] = useState<SheetTab>(null);

  const handleToggle = useCallback((tab: SheetTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, []);

  const handleClose = useCallback(() => {
    setActiveTab(null);
  }, []);

  return (
    <>
      {/* Fixed bottom tab bar (mobile only) */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex border-t bg-background lg:hidden">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex flex-col items-center gap-1 rounded-none py-3 h-auto",
            activeTab === "curriculum" ? "text-primary" : "text-muted-foreground",
          )}
          onClick={() => handleToggle("curriculum")}
          aria-label={t("sidebar.curriculum")}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[11px]">{t("sidebar.curriculum")}</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex flex-col items-center gap-1 rounded-none py-3 h-auto",
            activeTab === "discussion" ? "text-primary" : "text-muted-foreground",
          )}
          onClick={() => handleToggle("discussion")}
          aria-label={t("sidebar.discussion")}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[11px]">{t("sidebar.discussion")}</span>
        </Button>
      </div>

      {/* Curriculum Sheet (bottom) */}
      <Sheet open={activeTab === "curriculum"} onOpenChange={() => handleClose()}>
        <SheetContent side="bottom" className="h-[70vh] overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("sidebar.curriculum")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 mt-2">
            <CurriculumSidebar
              courseSlug={courseSlug}
              course={course}
              chapters={chapters}
              progress={progress}
              currentLessonId={currentLessonId}
              className="w-full border-r-0"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Discussion Sheet (bottom) */}
      <Sheet open={activeTab === "discussion"} onOpenChange={() => handleClose()}>
        <SheetContent side="bottom" className="h-[70vh] overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("sidebar.discussion")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-2">
            <DiscussionPanel lessonId={lessonId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
