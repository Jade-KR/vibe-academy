import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { eq, and, ne, asc, inArray } from "drizzle-orm";
import { updateCourseSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin, parseUuid } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const validId = parseUuid(id);
    if (!validId) return errorResponse("BAD_REQUEST", "Invalid ID format", 400);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [course] = await db.select().from(courses).where(eq(courses.id, validId)).limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, validId))
      .orderBy(asc(chapters.order));

    const chapterIds = courseChapters.map((c) => c.id);
    const allLessons =
      chapterIds.length > 0
        ? await db
            .select()
            .from(lessons)
            .where(inArray(lessons.chapterId, chapterIds))
            .orderBy(asc(lessons.order))
        : [];

    // Group lessons by chapterId using Map for O(1) lookups
    const lessonsByChapter = new Map<string, typeof allLessons>();
    for (const lesson of allLessons) {
      const existing = lessonsByChapter.get(lesson.chapterId);
      if (existing) {
        existing.push(lesson);
      } else {
        lessonsByChapter.set(lesson.chapterId, [lesson]);
      }
    }

    const chaptersWithLessons = courseChapters.map((chapter) => ({
      ...chapter,
      lessons: lessonsByChapter.get(chapter.id) ?? [],
    }));

    const totalLessons = allLessons.length;
    const totalDuration = allLessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);

    return successResponse({
      ...course,
      chapters: chaptersWithLessons,
      totalLessons,
      totalDuration,
    });
  } catch (error) {
    console.error("[GET /api/admin/courses/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const validId = parseUuid(id);
    if (!validId) return errorResponse("BAD_REQUEST", "Invalid ID format", 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
    }

    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // If slug is being updated, check uniqueness (excluding current course)
    if (parsed.data.slug) {
      const [existing] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.slug, parsed.data.slug), ne(courses.id, validId)))
        .limit(1);
      if (existing) {
        return errorResponse("CONFLICT", "A course with this slug already exists", 409);
      }
    }

    const [updated] = await db
      .update(courses)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(courses.id, validId))
      .returning({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        isPublished: courses.isPublished,
        updatedAt: courses.updatedAt,
      });

    if (!updated) return errorResponse("NOT_FOUND", "Course not found", 404);

    return successResponse(updated, "Course updated");
  } catch (error) {
    console.error("[PATCH /api/admin/courses/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const validId = parseUuid(id);
    if (!validId) return errorResponse("BAD_REQUEST", "Invalid ID format", 400);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [deleted] = await db
      .delete(courses)
      .where(eq(courses.id, validId))
      .returning({ id: courses.id });

    if (!deleted) return errorResponse("NOT_FOUND", "Course not found", 404);

    return successResponse(null, "Course deleted");
  } catch (error) {
    console.error("[DELETE /api/admin/courses/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
