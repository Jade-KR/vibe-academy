import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { chapters } from "@/db/schema/chapters";
import { eq } from "drizzle-orm";
import { updateChapterSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin, parseUuid } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    const parsed = updateChapterSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [updated] = await db
      .update(chapters)
      .set({ title: parsed.data.title })
      .where(eq(chapters.id, validId))
      .returning({
        id: chapters.id,
        title: chapters.title,
        order: chapters.order,
      });

    if (!updated) return errorResponse("NOT_FOUND", "Chapter not found", 404);

    return successResponse(updated, "Chapter updated");
  } catch (error) {
    console.error("[PATCH /api/admin/chapters/[id]]", error);
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
      .delete(chapters)
      .where(eq(chapters.id, validId))
      .returning({ id: chapters.id });

    if (!deleted) return errorResponse("NOT_FOUND", "Chapter not found", 404);

    return successResponse(null, "Chapter deleted");
  } catch (error) {
    console.error("[DELETE /api/admin/chapters/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
