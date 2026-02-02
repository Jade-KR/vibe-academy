import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { enrollments } from "@/db/schema/enrollments";
import { progress } from "@/db/schema/progress";
import { eq, and, asc, inArray } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;

    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Find course
    const [course] = await db
      .select({ id: courses.id, title: courses.title, slug: courses.slug })
      .from(courses)
      .where(and(eq(courses.slug, courseSlug), eq(courses.isPublished, true)))
      .limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // 3. Verify enrollment
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    if (!enrollment) return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);

    // 4. Get chapters with lessons (relational query)
    const chaptersWithLessons = await db.query.chapters.findMany({
      where: eq(chapters.courseId, course.id),
      orderBy: [asc(chapters.order)],
      columns: { id: true, title: true, order: true },
      with: {
        lessons: {
          orderBy: [asc(lessons.order)],
          columns: {
            id: true,
            title: true,
            duration: true,
            isPreview: true,
            order: true,
          },
        },
      },
    });

    // 5. Get user's progress for all lessons in this course
    const lessonIds = chaptersWithLessons.flatMap((c) => c.lessons.map((l) => l.id));
    const progressRecords =
      lessonIds.length > 0
        ? await db
            .select({
              lessonId: progress.lessonId,
              completed: progress.completed,
              position: progress.position,
            })
            .from(progress)
            .where(and(eq(progress.userId, dbUser.id), inArray(progress.lessonId, lessonIds)))
        : [];

    const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p]));

    // 6. Merge progress into curriculum
    let totalLessons = 0;
    let completedLessons = 0;

    const curriculum = chaptersWithLessons.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        const p = progressMap.get(lesson.id);
        totalLessons++;
        if (p?.completed) completedLessons++;
        return {
          ...lesson,
          completed: p?.completed ?? false,
          position: p?.position ?? 0,
        };
      }),
    }));

    return successResponse({
      course: { id: course.id, title: course.title, slug: course.slug },
      chapters: curriculum,
      progress: {
        totalLessons,
        completedLessons,
        percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/learn/[courseSlug]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
