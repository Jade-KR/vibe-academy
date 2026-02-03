"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface UpdateLessonData {
  title?: string;
  description?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  isPreview?: boolean;
}

interface UseCurriculumOptions {
  courseId: string;
  onMutate: () => void;
}

async function apiFetch(url: string, options: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? "An unexpected error occurred");
  }
  return json;
}

export function useCurriculum({ courseId, onMutate }: UseCurriculumOptions) {
  const t = useTranslations("admin");

  const addChapter = useCallback(
    async (title: string) => {
      try {
        await apiFetch(`/api/admin/courses/${courseId}/chapters`, {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        toast.success(t("chapters.added"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("chapters.addFailed"));
      }
    },
    [courseId, onMutate, t],
  );

  const updateChapter = useCallback(
    async (chapterId: string, title: string) => {
      try {
        await apiFetch(`/api/admin/chapters/${chapterId}`, {
          method: "PATCH",
          body: JSON.stringify({ title }),
        });
        toast.success(t("chapters.updated"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("chapters.updateFailed"));
      }
    },
    [onMutate, t],
  );

  const deleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        await apiFetch(`/api/admin/chapters/${chapterId}`, { method: "DELETE" });
        toast.success(t("chapters.deleted"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("chapters.deleteFailed"));
      }
    },
    [onMutate, t],
  );

  const addLesson = useCallback(
    async (
      chapterId: string,
      data: {
        title: string;
        description?: string;
        videoUrl?: string;
        duration?: number;
        isPreview?: boolean;
      },
    ) => {
      try {
        await apiFetch(`/api/admin/chapters/${chapterId}/lessons`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("lessons.added"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("lessons.addFailed"));
      }
    },
    [onMutate, t],
  );

  const updateLesson = useCallback(
    async (lessonId: string, data: UpdateLessonData) => {
      try {
        await apiFetch(`/api/admin/lessons/${lessonId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("lessons.updated"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("lessons.updateFailed"));
      }
    },
    [onMutate, t],
  );

  const deleteLesson = useCallback(
    async (lessonId: string) => {
      try {
        await apiFetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
        toast.success(t("lessons.deleted"));
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("lessons.deleteFailed"));
      }
    },
    [onMutate, t],
  );

  const reorder = useCallback(
    async (
      chaptersData: { id: string; order: number; lessons: { id: string; order: number }[] }[],
    ) => {
      try {
        await apiFetch(`/api/admin/courses/${courseId}/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ chapters: chaptersData }),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("reorderFailed"));
        onMutate(); // Revert optimistic update
      }
    },
    [courseId, onMutate, t],
  );

  return {
    addChapter,
    updateChapter,
    deleteChapter,
    addLesson,
    updateLesson,
    deleteLesson,
    reorder,
  };
}
