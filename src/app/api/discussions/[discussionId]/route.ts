import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { discussions } from "@/db/schema/discussions";
import { eq } from "drizzle-orm";
import { updateDiscussionSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ discussionId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { discussionId } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = updateDiscussionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 3. Find discussion and verify ownership
    const [discussion] = await db
      .select({ id: discussions.id, userId: discussions.userId })
      .from(discussions)
      .where(eq(discussions.id, discussionId))
      .limit(1);
    if (!discussion) return errorResponse("NOT_FOUND", "Discussion not found", 404);
    if (discussion.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You can only edit your own discussions", 403);
    }

    // 4. Update
    const [updated] = await db
      .update(discussions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(discussions.id, discussionId))
      .returning({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        updatedAt: discussions.updatedAt,
      });

    return successResponse(updated, "Discussion updated");
  } catch (error) {
    console.error("[PATCH /api/discussions/[discussionId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { discussionId } = await context.params;

    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Find discussion
    const [discussion] = await db
      .select({ id: discussions.id, userId: discussions.userId })
      .from(discussions)
      .where(eq(discussions.id, discussionId))
      .limit(1);
    if (!discussion) return errorResponse("NOT_FOUND", "Discussion not found", 404);

    // 3. Owner or admin check
    const isOwner = discussion.userId === dbUser.id;
    const isAdmin = dbUser.role === "admin";
    if (!isOwner && !isAdmin) {
      return errorResponse("FORBIDDEN", "You can only delete your own discussions", 403);
    }

    // 4. Delete (cascades to comments via FK)
    await db.delete(discussions).where(eq(discussions.id, discussionId));

    return successResponse(null, "Discussion deleted");
  } catch (error) {
    console.error("[DELETE /api/discussions/[discussionId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
