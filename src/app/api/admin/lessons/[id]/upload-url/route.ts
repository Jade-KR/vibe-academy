import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { lessons } from "@/db/schema/lessons";
import { eq } from "drizzle-orm";
import { uploadUrlSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin, parseUuid } from "@/shared/lib/api/admin-guard";
import { getPresignedUploadUrl } from "@/shared/api/r2";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
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

    const parsed = uploadUrlSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Verify lesson exists
    const [lesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.id, validId))
      .limit(1);
    if (!lesson) return errorResponse("NOT_FOUND", "Lesson not found", 404);

    const { objectKey, contentType } = parsed.data;
    const uploadUrl = await getPresignedUploadUrl(objectKey, contentType);

    if (!uploadUrl) {
      return errorResponse("INTERNAL_ERROR", "R2 storage is not configured", 500);
    }

    return successResponse({ uploadUrl, objectKey }, "Upload URL generated");
  } catch (error) {
    console.error("[POST /api/admin/lessons/[id]/upload-url]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
