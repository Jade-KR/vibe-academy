import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { reviews } from "@/db/schema/reviews";
import { eq } from "drizzle-orm";
import { updateReviewSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = updateReviewSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 3. Find review and verify ownership
    const [review] = await db
      .select({ id: reviews.id, userId: reviews.userId })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) return errorResponse("NOT_FOUND", "Review not found", 404);
    if (review.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You can only edit your own reviews", 403);
    }

    // 4. Update
    const [updated] = await db
      .update(reviews)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        updatedAt: reviews.updatedAt,
      });

    return successResponse(updated, "Review updated");
  } catch (error) {
    console.error("[PATCH /api/reviews/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Find review and verify ownership
    const [review] = await db
      .select({ id: reviews.id, userId: reviews.userId })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) return errorResponse("NOT_FOUND", "Review not found", 404);
    if (review.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You can only delete your own reviews", 403);
    }

    // 3. Delete
    await db.delete(reviews).where(eq(reviews.id, id));

    return successResponse(null, "Review deleted");
  } catch (error) {
    console.error("[DELETE /api/reviews/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
