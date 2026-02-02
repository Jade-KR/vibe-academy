import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";
import { getVideoUrl } from "@/shared/api/r2";

type RouteContext = {
  params: Promise<{ courseSlug: string; lessonId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug, lessonId } = await context.params;

    // 1. Find course
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.slug, courseSlug), eq(courses.isPublished, true)))
      .limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // 2. Find lesson with chapter info (verify it belongs to this course)
    const [lesson] = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        videoUrl: lessons.videoUrl,
        duration: lessons.duration,
        isPreview: lessons.isPreview,
        order: lessons.order,
        chapterId: lessons.chapterId,
      })
      .from(lessons)
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(and(eq(lessons.id, lessonId), eq(chapters.courseId, course.id)))
      .limit(1);
    if (!lesson) return errorResponse("NOT_FOUND", "Lesson not found", 404);

    // 3. Auth check (skip for preview lessons)
    if (!lesson.isPreview) {
      const { dbUser, response } = await getDbUser();
      if (!dbUser) return response;

      // 4. Enrollment check
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, course.id)))
        .limit(1);
      if (!enrollment) return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);
    }

    // 5. Generate video URL (R2 public domain or presigned)
    const videoUrl = lesson.videoUrl ? await getVideoUrl(lesson.videoUrl) : null;

    return successResponse({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoUrl,
      duration: lesson.duration,
      isPreview: lesson.isPreview,
      order: lesson.order,
    });
  } catch (error) {
    console.error("[GET /api/learn/[courseSlug]/lessons/[lessonId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
