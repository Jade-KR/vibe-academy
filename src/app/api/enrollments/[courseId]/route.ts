import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { courseId } = await context.params;

    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Check enrollment
    const [enrollment] = await db
      .select({
        id: enrollments.id,
        purchasedAt: enrollments.purchasedAt,
        expiresAt: enrollments.expiresAt,
      })
      .from(enrollments)
      .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      return successResponse({ enrolled: false, enrollment: null });
    }

    return successResponse({ enrolled: true, enrollment });
  } catch (error) {
    console.error("[GET /api/enrollments/[courseId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
