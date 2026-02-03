"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui";
import type { Chapter, Lesson } from "@/db/schema";
import { useCurriculum } from "../model/use-curriculum";
import { SortableChapter } from "./sortable-chapter";
import { ChapterDialog } from "./chapter-dialog";
import { LessonDialog } from "./lesson-dialog";

type ChapterWithLessons = Chapter & { lessons: Lesson[] };

interface CurriculumEditorProps {
  courseId: string;
  chapters: ChapterWithLessons[];
  onMutate: () => void;
}

export function CurriculumEditor({
  courseId,
  chapters: propChapters,
  onMutate,
}: CurriculumEditorProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [localChapters, setLocalChapters] = useState<ChapterWithLessons[]>(propChapters);

  // Sync local state when props change (after server revalidation)
  useEffect(() => {
    setLocalChapters(propChapters);
  }, [propChapters]);

  const curriculum = useCurriculum({ courseId, onMutate });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Dialog state
  const [chapterDialog, setChapterDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    chapterId?: string;
    title?: string;
  }>({ open: false, mode: "create" });

  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    chapterId?: string;
    lesson?: Lesson;
  }>({ open: false, mode: "create" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "chapter" | "lesson";
    id: string;
  } | null>(null);

  // Build reorder payload from local state
  const buildReorderPayload = useCallback(
    (chaps: ChapterWithLessons[]) =>
      chaps.map((ch, i) => ({
        id: ch.id,
        order: i,
        lessons: ch.lessons.map((l, j) => ({ id: l.id, order: j })),
      })),
    [],
  );

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Chapter reorder
    if (activeId.startsWith("chapter-") && overId.startsWith("chapter-")) {
      const oldIndex = localChapters.findIndex((c) => `chapter-${c.id}` === activeId);
      const newIndex = localChapters.findIndex((c) => `chapter-${c.id}` === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newChapters = arrayMove(localChapters, oldIndex, newIndex);
      setLocalChapters(newChapters);
      curriculum.reorder(buildReorderPayload(newChapters));
      return;
    }

    // Lesson reorder within same chapter
    if (activeId.startsWith("lesson-") && overId.startsWith("lesson-")) {
      const activeLessonId = activeId.replace("lesson-", "");
      const overLessonId = overId.replace("lesson-", "");

      // Find which chapter contains the active lesson
      const chapterIndex = localChapters.findIndex((c) =>
        c.lessons.some((l) => l.id === activeLessonId),
      );
      if (chapterIndex === -1) return;

      const chapter = localChapters[chapterIndex];
      const oldIndex = chapter.lessons.findIndex((l) => l.id === activeLessonId);
      const newIndex = chapter.lessons.findIndex((l) => l.id === overLessonId);
      if (oldIndex === -1 || newIndex === -1) return;

      // Only same-chapter reorder for now
      if (!chapter.lessons.some((l) => l.id === overLessonId)) return;

      const newLessons = arrayMove(chapter.lessons, oldIndex, newIndex);
      const newChapters = [...localChapters];
      newChapters[chapterIndex] = { ...chapter, lessons: newLessons };
      setLocalChapters(newChapters);
      curriculum.reorder(buildReorderPayload(newChapters));
    }
  }

  // Chapter dialog handlers
  async function handleChapterSubmit(title: string) {
    if (chapterDialog.mode === "create") {
      await curriculum.addChapter(title);
    } else if (chapterDialog.chapterId) {
      await curriculum.updateChapter(chapterDialog.chapterId, title);
    }
  }

  // Lesson dialog handlers
  async function handleLessonSubmit(data: {
    title: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    isPreview?: boolean;
  }) {
    if (lessonDialog.mode === "create" && lessonDialog.chapterId) {
      await curriculum.addLesson(lessonDialog.chapterId, data);
    } else if (lessonDialog.mode === "edit" && lessonDialog.lesson) {
      await curriculum.updateLesson(lessonDialog.lesson.id, data);
    }
  }

  // Delete confirmation handler
  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "chapter") {
      await curriculum.deleteChapter(deleteConfirm.id);
    } else {
      await curriculum.deleteLesson(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  }

  const chapterIds = localChapters.map((c) => `chapter-${c.id}`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("chapters.title")}</CardTitle>
        <Button size="sm" onClick={() => setChapterDialog({ open: true, mode: "create" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("chapters.add")}
        </Button>
      </CardHeader>
      <CardContent>
        {localChapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No chapters yet</p>
            <Button
              variant="outline"
              onClick={() => setChapterDialog({ open: true, mode: "create" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("chapters.add")}
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {localChapters.map((chapter) => (
                  <SortableChapter
                    key={chapter.id}
                    chapter={chapter}
                    onEditChapter={() =>
                      setChapterDialog({
                        open: true,
                        mode: "edit",
                        chapterId: chapter.id,
                        title: chapter.title,
                      })
                    }
                    onDeleteChapter={() =>
                      setDeleteConfirm({
                        open: true,
                        type: "chapter",
                        id: chapter.id,
                      })
                    }
                    onAddLesson={() =>
                      setLessonDialog({
                        open: true,
                        mode: "create",
                        chapterId: chapter.id,
                      })
                    }
                    onEditLesson={(lesson) =>
                      setLessonDialog({
                        open: true,
                        mode: "edit",
                        lesson,
                      })
                    }
                    onDeleteLesson={(lessonId) =>
                      setDeleteConfirm({
                        open: true,
                        type: "lesson",
                        id: lessonId,
                      })
                    }
                    onToggleLessonPreview={(lessonId, isPreview) =>
                      curriculum.updateLesson(lessonId, { isPreview })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Chapter dialog */}
      <ChapterDialog
        open={chapterDialog.open}
        onOpenChange={(open) => setChapterDialog((prev) => ({ ...prev, open }))}
        mode={chapterDialog.mode}
        initialTitle={chapterDialog.title}
        onSubmit={handleChapterSubmit}
      />

      {/* Lesson dialog */}
      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((prev) => ({ ...prev, open }))}
        mode={lessonDialog.mode}
        initialData={
          lessonDialog.lesson
            ? {
                title: lessonDialog.lesson.title,
                description: lessonDialog.lesson.description ?? "",
                videoUrl: lessonDialog.lesson.videoUrl ?? "",
                duration: lessonDialog.lesson.duration ?? 0,
                isPreview: lessonDialog.lesson.isPreview,
              }
            : undefined
        }
        onSubmit={handleLessonSubmit}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm?.open} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.type === "chapter" ? t("chapters.delete") : t("lessons.delete")}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "chapter"
                ? "Are you sure? This will delete all lessons in this chapter."
                : "Are you sure you want to delete this lesson?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
