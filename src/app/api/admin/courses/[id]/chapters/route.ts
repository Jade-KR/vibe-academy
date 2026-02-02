import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { chapters } from "@/db/schema/chapters";
import { courses } from "@/db/schema/courses";
import { eq, sql } from "drizzle-orm";
import { createChapterSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin, parseUuid } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: courseId } = await context.params;
    const validCourseId = parseUuid(courseId);
    if (!validCourseId) return errorResponse("BAD_REQUEST", "Invalid ID format", 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
    }

    const parsed = createChapterSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Verify course exists
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, validCourseId))
      .limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // Compute order if not provided — use transaction for atomicity
    const [created] = await db.transaction(async (tx) => {
      let order = parsed.data.order;
      if (order === undefined) {
        const [{ maxOrder }] = await tx
          .select({ maxOrder: sql<number>`coalesce(max(${chapters.order}), -1)` })
          .from(chapters)
          .where(eq(chapters.courseId, validCourseId));
        order = maxOrder + 1;
      }

      return tx
        .insert(chapters)
        .values({ courseId: validCourseId, title: parsed.data.title, order })
        .returning({
          id: chapters.id,
          courseId: chapters.courseId,
          title: chapters.title,
          order: chapters.order,
          createdAt: chapters.createdAt,
        });
    });

    return successResponse(created, "Chapter created", 201);
  } catch (error) {
    console.error("[POST /api/admin/courses/[id]/chapters]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
