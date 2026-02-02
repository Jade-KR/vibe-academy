import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { eq, and, ne } from "drizzle-orm";
import { updateCourseSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // If slug is being updated, check uniqueness (excluding current course)
    if (parsed.data.slug) {
      const [existing] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.slug, parsed.data.slug), ne(courses.id, id)))
        .limit(1);
      if (existing) {
        return errorResponse("CONFLICT", "A course with this slug already exists", 409);
      }
    }

    const [updated] = await db
      .update(courses)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(courses.id, id))
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

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [deleted] = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning({ id: courses.id });

    if (!deleted) return errorResponse("NOT_FOUND", "Course not found", 404);

    return successResponse(null, "Course deleted");
  } catch (error) {
    console.error("[DELETE /api/admin/courses/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
