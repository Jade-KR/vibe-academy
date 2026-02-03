"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSWRConfig } from "swr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseProgressSaverOptions {
  lessonId: string | undefined;
  courseSlug: string | undefined;
  initialPosition?: number;
  initialCompleted?: boolean;
}

export interface UseProgressSaverReturn {
  /** Wire to VideoPlayer onTimeUpdate(currentTime, duration) */
  handleTimeUpdate: (currentTime: number, duration: number) => void;
  /** Wire to VideoPlayer onEnded */
  handleEnded: () => void;
  /** Manual complete action for "Complete & Next" button */
  manualComplete: () => Promise<void>;
  /** Whether this lesson is completed (for UI display) */
  isCompleted: boolean;
  /** True during manual complete save only */
  isSaving: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers (module-level, no hook dependency)
// ---------------------------------------------------------------------------

const THROTTLE_INTERVAL_MS = 5_000;
const AUTO_COMPLETE_THRESHOLD = 0.9;

async function savePosition(lessonId: string, position: number): Promise<void> {
  try {
    await fetch(`/api/progress/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position }),
    });
  } catch (error) {
    console.error("[useProgressSaver] savePosition failed:", error);
  }
}

async function saveCompleted(lessonId: string, position: number): Promise<void> {
  const res = await fetch(`/api/progress/${lessonId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true, position }),
  });
  if (!res.ok) {
    throw new Error(`saveCompleted failed: ${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProgressSaver({
  lessonId,
  courseSlug,
  initialPosition = 0,
  initialCompleted = false,
}: UseProgressSaverOptions): UseProgressSaverReturn {
  const { mutate } = useSWRConfig();

  // --- Refs for transient values (no re-renders) ---
  const lastSaveTimestampRef = useRef(0);
  const hasAutoCompletedRef = useRef(false);
  const isCompletedRef = useRef(initialCompleted);
  const positionRef = useRef(initialPosition);

  // --- State for UI display ---
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isSaving, setIsSaving] = useState(false);

  // --- SWR cache key for curriculum ---
  const curriculumKey = courseSlug ? `/api/learn/${courseSlug}` : null;

  // --- Reset on lesson change ---
  useEffect(() => {
    hasAutoCompletedRef.current = false;
    lastSaveTimestampRef.current = 0;
    isCompletedRef.current = initialCompleted;
    positionRef.current = initialPosition;
    setIsCompleted(initialCompleted);
    setIsSaving(false);
  }, [lessonId, initialCompleted, initialPosition]);

  // --- handleTimeUpdate: throttled position save + auto-complete check ---
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!lessonId) return;

      const truncatedPosition = Math.floor(currentTime);
      positionRef.current = truncatedPosition;

      // Throttled position save (fire-and-forget)
      const now = Date.now();
      if (now - lastSaveTimestampRef.current >= THROTTLE_INTERVAL_MS) {
        lastSaveTimestampRef.current = now;
        // Fire-and-forget: no await
        savePosition(lessonId, truncatedPosition);
      }

      // Auto-complete at 90% threshold
      if (
        duration > 0 &&
        currentTime / duration >= AUTO_COMPLETE_THRESHOLD &&
        !hasAutoCompletedRef.current &&
        !isCompletedRef.current
      ) {
        hasAutoCompletedRef.current = true;
        // Awaited internally for SWR mutate, but not blocking the caller
        saveCompleted(lessonId, truncatedPosition)
          .then(() => {
            isCompletedRef.current = true;
            setIsCompleted(true);
            if (curriculumKey) {
              mutate(curriculumKey);
            }
          })
          .catch((error) => {
            // Reset auto-complete flag so it can retry
            hasAutoCompletedRef.current = false;
            console.error("[useProgressSaver] auto-complete failed:", error);
          });
      }
    },
    [lessonId, curriculumKey, mutate],
  );

  // --- handleEnded: complete if not already completed ---
  const handleEnded = useCallback(() => {
    if (!lessonId || isCompletedRef.current) return;

    saveCompleted(lessonId, positionRef.current)
      .then(() => {
        isCompletedRef.current = true;
        setIsCompleted(true);
        if (curriculumKey) {
          mutate(curriculumKey);
        }
      })
      .catch((error) => {
        console.error("[useProgressSaver] handleEnded failed:", error);
      });
  }, [lessonId, curriculumKey, mutate]);

  // --- manualComplete: for "Complete & Next" button ---
  const manualComplete = useCallback(async () => {
    if (!lessonId) return;

    setIsSaving(true);
    try {
      await saveCompleted(lessonId, positionRef.current);
      isCompletedRef.current = true;
      setIsCompleted(true);
      if (curriculumKey) {
        await mutate(curriculumKey);
      }
    } catch (error) {
      console.error("[useProgressSaver] manualComplete failed:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [lessonId, curriculumKey, mutate]);

  return {
    handleTimeUpdate,
    handleEnded,
    manualComplete,
    isCompleted,
    isSaving,
  };
}
