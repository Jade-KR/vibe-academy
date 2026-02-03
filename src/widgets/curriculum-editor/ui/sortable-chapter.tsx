"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { GripVertical, Pencil, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import type { Chapter, Lesson } from "@/db/schema";
import { SortableLesson } from "./sortable-lesson";

interface SortableChapterProps {
  chapter: Chapter & { lessons: Lesson[] };
  onEditChapter: () => void;
  onDeleteChapter: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onToggleLessonPreview: (lessonId: string, isPreview: boolean) => void;
}

export function SortableChapter({
  chapter,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleLessonPreview,
}: SortableChapterProps) {
  const t = useTranslations("admin");
  const [expanded, setExpanded] = useState(true);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chapter-${chapter.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lessonIds = chapter.lessons.map((l) => `lesson-${l.id}`);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card">
      {/* Chapter header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <span className="flex-1 font-medium truncate">{chapter.title}</span>

        <Badge variant="secondary" className="text-xs">
          {chapter.lessons.length} lessons
        </Badge>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddLesson}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">{t("lessons.add")}</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditChapter}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t("chapters.edit")}</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDeleteChapter}>
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">{t("chapters.delete")}</span>
        </Button>
      </div>

      {/* Lessons list */}
      {expanded ? (
        <div className="space-y-1 px-3 pb-3 pl-10">
          {chapter.lessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No lessons yet</p>
          ) : (
            <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
              {chapter.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={() => onEditLesson(lesson)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onTogglePreview={(isPreview) => onToggleLessonPreview(lesson.id, isPreview)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      ) : null}
    </div>
  );
}
