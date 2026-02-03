"use client";

import { useCallback } from "react";
import { toast } from "sonner";

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
  const addChapter = useCallback(
    async (title: string) => {
      try {
        await apiFetch(`/api/admin/courses/${courseId}/chapters`, {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        toast.success("Chapter added");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add chapter");
      }
    },
    [courseId, onMutate],
  );

  const updateChapter = useCallback(
    async (chapterId: string, title: string) => {
      try {
        await apiFetch(`/api/admin/chapters/${chapterId}`, {
          method: "PATCH",
          body: JSON.stringify({ title }),
        });
        toast.success("Chapter updated");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update chapter");
      }
    },
    [onMutate],
  );

  const deleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        await apiFetch(`/api/admin/chapters/${chapterId}`, { method: "DELETE" });
        toast.success("Chapter deleted");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete chapter");
      }
    },
    [onMutate],
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
        toast.success("Lesson added");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add lesson");
      }
    },
    [onMutate],
  );

  const updateLesson = useCallback(
    async (lessonId: string, data: Record<string, unknown>) => {
      try {
        await apiFetch(`/api/admin/lessons/${lessonId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success("Lesson updated");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update lesson");
      }
    },
    [onMutate],
  );

  const deleteLesson = useCallback(
    async (lessonId: string) => {
      try {
        await apiFetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
        toast.success("Lesson deleted");
        onMutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete lesson");
      }
    },
    [onMutate],
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
        toast.error(err instanceof Error ? err.message : "Failed to reorder");
        onMutate(); // Revert optimistic update
      }
    },
    [courseId, onMutate],
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
