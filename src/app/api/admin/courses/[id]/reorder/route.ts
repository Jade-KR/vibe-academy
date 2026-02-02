import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { courses } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { reorderSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: courseId } = await context.params;
    const body: unknown = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Verify course exists
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // Atomic reorder using transaction
    await db.transaction(async (tx) => {
      for (const chapter of parsed.data.chapters) {
        await tx.update(chapters).set({ order: chapter.order }).where(eq(chapters.id, chapter.id));

        if (chapter.lessons) {
          for (const lesson of chapter.lessons) {
            await tx.update(lessons).set({ order: lesson.order }).where(eq(lessons.id, lesson.id));
          }
        }
      }
    });

    return successResponse(null, "Reorder complete");
  } catch (error) {
    console.error("[PATCH /api/admin/courses/[id]/reorder]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
