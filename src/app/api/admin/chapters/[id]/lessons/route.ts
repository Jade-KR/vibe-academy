import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { lessons } from "@/db/schema/lessons";
import { chapters } from "@/db/schema/chapters";
import { eq, sql } from "drizzle-orm";
import { createLessonSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: chapterId } = await context.params;
    const body: unknown = await request.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Verify chapter exists
    const [chapter] = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    if (!chapter) return errorResponse("NOT_FOUND", "Chapter not found", 404);

    // Compute order if not provided
    let order = parsed.data.order;
    if (order === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${lessons.order}), -1)` })
        .from(lessons)
        .where(eq(lessons.chapterId, chapterId));
      order = maxOrder + 1;
    }

    const [created] = await db
      .insert(lessons)
      .values({
        chapterId,
        title: parsed.data.title,
        description: parsed.data.description,
        videoUrl: parsed.data.videoUrl,
        duration: parsed.data.duration,
        isPreview: parsed.data.isPreview,
        order,
      })
      .returning({
        id: lessons.id,
        chapterId: lessons.chapterId,
        title: lessons.title,
        order: lessons.order,
        createdAt: lessons.createdAt,
      });

    return successResponse(created, "Lesson created", 201);
  } catch (error) {
    console.error("[POST /api/admin/chapters/[id]/lessons]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
