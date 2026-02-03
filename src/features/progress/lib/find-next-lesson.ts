// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NextLessonResult {
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
}

interface ChapterWithLessons {
  title: string;
  lessons: Array<{ id: string; title: string }>;
}

// ---------------------------------------------------------------------------
// findNextLesson
// ---------------------------------------------------------------------------

/**
 * Find the next lesson after the given lessonId in curriculum order.
 * Traverses chapters in order, then lessons within each chapter.
 * Returns null if the current lesson is the last one in the course.
 *
 * @param chapters - Ordered array of chapters with lessons
 * @param currentLessonId - The ID of the current lesson
 */
export function findNextLesson(
  chapters: ChapterWithLessons[],
  currentLessonId: string,
): NextLessonResult | null {
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

  // Not found or last lesson
  if (currentIndex === -1 || currentIndex === flatLessons.length - 1) {
    return null;
  }

  const next = flatLessons[currentIndex + 1];
  return {
    lessonId: next.id,
    lessonTitle: next.title,
    chapterTitle: next.chapterTitle,
  };
}
