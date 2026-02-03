// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChapterProgressResult {
  chapterId: string;
  chapterTitle: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
}

interface ChapterInput {
  id: string;
  title: string;
  lessons: Array<{ completed: boolean }>;
}

interface ChapterLessonsInput {
  lessons: Array<{ completed: boolean }>;
}

// ---------------------------------------------------------------------------
// calculateChapterProgress
// ---------------------------------------------------------------------------

/**
 * Calculate progress for each chapter from curriculum data.
 * Returns an array of chapter progress results with completion percentages.
 *
 * @param chapters - Array from GET /api/learn/[courseSlug] response
 */
export function calculateChapterProgress(chapters: ChapterInput[]): ChapterProgressResult[] {
  return chapters.map((chapter) => {
    const totalLessons = chapter.lessons.length;
    const completedLessons = chapter.lessons.filter((l) => l.completed).length;
    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      completedLessons,
      totalLessons,
      percent,
    };
  });
}

// ---------------------------------------------------------------------------
// calculateCourseProgress
// ---------------------------------------------------------------------------

/**
 * Calculate overall course progress from curriculum data.
 * Returns the same shape as the API's progress field.
 *
 * @param chapters - Array from GET /api/learn/[courseSlug] response
 */
export function calculateCourseProgress(chapters: ChapterLessonsInput[]): {
  totalLessons: number;
  completedLessons: number;
  percent: number;
} {
  let totalLessons = 0;
  let completedLessons = 0;

  for (const chapter of chapters) {
    totalLessons += chapter.lessons.length;
    for (const lesson of chapter.lessons) {
      if (lesson.completed) completedLessons++;
    }
  }

  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return { totalLessons, completedLessons, percent };
}
