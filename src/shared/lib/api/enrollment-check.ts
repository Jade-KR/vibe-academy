import { db } from "@/db/client";
import { lessons } from "@/db/schema/lessons";
import { chapters } from "@/db/schema/chapters";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and } from "drizzle-orm";

/**
 * Verify a user is enrolled in the course that contains a given lesson.
 * Returns { courseId, enrolled: true } or { courseId: null, enrolled: false }.
 */
export async function verifyLessonEnrollment(
  lessonId: string,
  userId: string,
): Promise<
  { courseId: string; enrolled: true } | { courseId: null; enrolled: false; lessonExists: boolean }
> {
  const [lesson] = await db
    .select({ chapterId: lessons.chapterId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!lesson) return { courseId: null, enrolled: false, lessonExists: false };

  const [chapter] = await db
    .select({ courseId: chapters.courseId })
    .from(chapters)
    .where(eq(chapters.id, lesson.chapterId))
    .limit(1);
  if (!chapter) return { courseId: null, enrolled: false, lessonExists: false };

  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, chapter.courseId)))
    .limit(1);

  if (!enrollment) return { courseId: null, enrolled: false, lessonExists: true };
  return { courseId: chapter.courseId, enrolled: true };
}
