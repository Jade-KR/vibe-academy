// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviousLessonResult {
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
}

interface ChapterWithLessons {
  title: string;
  lessons: Array<{ id: string; title: string }>;
}

// ---------------------------------------------------------------------------
// findPreviousLesson
// ---------------------------------------------------------------------------

/**
 * Find the previous lesson before the given lessonId in curriculum order.
 * Traverses chapters in order, then lessons within each chapter.
 * Returns null if the current lesson is the first one in the course.
 *
 * @param chapters - Ordered array of chapters with lessons
 * @param currentLessonId - The ID of the current lesson
 */
export function findPreviousLesson(
  chapters: ChapterWithLessons[],
  currentLessonId: string,
): PreviousLessonResult | null {
  // Flatten all lessons with their chapter info to simplify traversal
  const flatLessons: Array<{ id: string; title: string; chapterTitle: string }> = [];

  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      flatLessons.push({
        id: lesson.id,
        title: lesson.title,
        chapterTitle: chapter.title,
      });
    }
  }

  const currentIndex = flatLessons.findIndex((l) => l.id === currentLessonId);

  // Not found or first lesson
  if (currentIndex <= 0) {
    return null;
  }

  const prev = flatLessons[currentIndex - 1];
  return {
    lessonId: prev.id,
    lessonTitle: prev.title,
    chapterTitle: prev.chapterTitle,
  };
}
