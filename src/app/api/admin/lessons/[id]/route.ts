import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { lessons } from "@/db/schema/lessons";
import { eq } from "drizzle-orm";
import { updateLessonSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [updated] = await db
      .update(lessons)
      .set(parsed.data)
      .where(eq(lessons.id, id))
      .returning({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        videoUrl: lessons.videoUrl,
        duration: lessons.duration,
        isPreview: lessons.isPreview,
        order: lessons.order,
      });

    if (!updated) return errorResponse("NOT_FOUND", "Lesson not found", 404);

    return successResponse(updated, "Lesson updated");
  } catch (error) {
    console.error("[PATCH /api/admin/lessons/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [deleted] = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning({ id: lessons.id });

    if (!deleted) return errorResponse("NOT_FOUND", "Lesson not found", 404);

    return successResponse(null, "Lesson deleted");
  } catch (error) {
    console.error("[DELETE /api/admin/lessons/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
