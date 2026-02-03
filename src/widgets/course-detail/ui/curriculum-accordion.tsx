"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
  Button,
} from "@/shared/ui";
import { PlayCircle, Lock } from "lucide-react";
import { formatDuration, formatLessonDuration } from "@/shared/lib/format";
import type { CourseDetail } from "@/entities/course";

type Chapter = CourseDetail["chapters"][number];

interface CurriculumAccordionProps {
  chapters: Chapter[];
  totalLessons: number;
  totalDuration: number;
}

export function CurriculumAccordion({
  chapters,
  totalLessons,
  totalDuration,
}: CurriculumAccordionProps) {
  const t = useTranslations("course");
  const allChapterIds = chapters.map((ch) => ch.id);
  const [openChapters, setOpenChapters] = useState<string[]>([]);

  const isAllExpanded = openChapters.length === chapters.length;

  const toggleAll = useCallback(() => {
    if (isAllExpanded) {
      setOpenChapters([]);
    } else {
      setOpenChapters(allChapterIds);
    }
  }, [isAllExpanded, allChapterIds]);

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t("curriculum")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("detail.curriculum.totalChapters", { count: chapters.length })}
            {" / "}
            {t("lessons", { count: totalLessons })}
            {" / "}
            {formatDuration(totalDuration)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {isAllExpanded ? t("detail.curriculum.collapseAll") : t("detail.curriculum.expandAll")}
        </Button>
      </div>

      {/* Accordion */}
      <Accordion type="multiple" value={openChapters} onValueChange={setOpenChapters}>
        {chapters.map((chapter, chapterIndex) => (
          <AccordionItem key={chapter.id} value={chapter.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {chapterIndex + 1}.
                </span>
                <span className="font-medium">{chapter.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("lessons", { count: chapter.lessons.length })}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <LessonItem key={lesson.id} lesson={lesson} index={lessonIndex + 1} />
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

interface LessonItemProps {
  lesson: Chapter["lessons"][number];
  index: number;
}

function LessonItem({ lesson, index }: LessonItemProps) {
  const t = useTranslations("course");

  return (
    <li className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50">
      {/* Icon */}
      {lesson.isPreview ? (
        <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      )}

      {/* Title */}
      <span className="flex-1 text-foreground">
        {index}. {lesson.title}
      </span>

      {/* Preview badge */}
      {lesson.isPreview ? (
        <Badge variant="secondary" className="text-xs">
          {t("preview")}
        </Badge>
      ) : null}

      {/* Duration */}
      {lesson.duration ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatLessonDuration(lesson.duration)}
        </span>
      ) : null}
    </li>
  );
}
