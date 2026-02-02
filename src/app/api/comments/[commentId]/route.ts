import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { comments } from "@/db/schema/comments";
import { eq } from "drizzle-orm";
import { updateCommentSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ commentId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { commentId } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 3. Find comment and verify ownership
    const [comment] = await db
      .select({ id: comments.id, userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    if (!comment) return errorResponse("NOT_FOUND", "Comment not found", 404);
    if (comment.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You can only edit your own comments", 403);
    }

    // 4. Update
    const [updated] = await db
      .update(comments)
      .set({ content: parsed.data.content, updatedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning({
        id: comments.id,
        content: comments.content,
        updatedAt: comments.updatedAt,
      });

    return successResponse(updated, "Comment updated");
  } catch (error) {
    console.error("[PATCH /api/comments/[commentId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { commentId } = await context.params;

    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Find comment
    const [comment] = await db
      .select({ id: comments.id, userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    if (!comment) return errorResponse("NOT_FOUND", "Comment not found", 404);

    // 3. Owner or admin check
    const isOwner = comment.userId === dbUser.id;
    const isAdmin = dbUser.role === "admin";
    if (!isOwner && !isAdmin) {
      return errorResponse("FORBIDDEN", "You can only delete your own comments", 403);
    }

    // 4. Delete
    await db.delete(comments).where(eq(comments.id, commentId));

    return successResponse(null, "Comment deleted");
  } catch (error) {
    console.error("[DELETE /api/comments/[commentId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
