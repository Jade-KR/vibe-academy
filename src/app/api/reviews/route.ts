import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { reviews } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { reviewListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";

export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = reviewListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { page, pageSize } = parsed.data;

    // Compute 6-month cutoff date
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Step 1: Count total reviews in timeframe (only for published courses)
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(and(gte(reviews.createdAt, sixMonthsAgo), eq(courses.isPublished, true)));

    // Step 2: Fetch paginated reviews with user + course info
    const items = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        createdAt: reviews.createdAt,
        user: {
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        course: {
          title: courses.title,
          slug: courses.slug,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(and(gte(reviews.createdAt, sixMonthsAgo), eq(courses.isPublished, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return successResponse({
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    console.error("[GET /api/reviews]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
