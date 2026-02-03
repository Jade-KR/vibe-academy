"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { GripVertical, Pencil, Trash2, Eye } from "lucide-react";
import { Button, Badge, Switch } from "@/shared/ui";
import type { Lesson } from "@/db/schema";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface SortableLessonProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePreview: (isPreview: boolean) => void;
}

export function SortableLesson({ lesson, onEdit, onDelete, onTogglePreview }: SortableLessonProps) {
  const t = useTranslations("admin");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lesson-${lesson.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="flex-1 truncate text-sm">{lesson.title}</span>

      {lesson.duration ? (
        <Badge variant="secondary" className="text-xs">
          {formatDuration(lesson.duration)}
        </Badge>
      ) : null}

      {lesson.isPreview ? (
        <Badge variant="outline" className="text-xs">
          <Eye className="mr-1 h-3 w-3" />
          Preview
        </Badge>
      ) : null}

      <Switch
        checked={lesson.isPreview}
        onCheckedChange={(checked) => onTogglePreview(checked)}
        aria-label={t("lessons.isPreview")}
        className="scale-75"
      />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">{t("lessons.edit")}</span>
      </Button>

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
        <span className="sr-only">{t("lessons.delete")}</span>
      </Button>
    </div>
  );
}
