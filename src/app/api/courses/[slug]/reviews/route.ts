import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { reviews } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { eq, and, desc, sql } from "drizzle-orm";
import { reviewListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Parse query params
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = reviewListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { page, pageSize } = parsed.data;

    // Step 1: Resolve slug to course ID (only published courses)
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
      .limit(1);

    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // Step 2: Count total reviews for pagination metadata
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(reviews)
      .where(eq(reviews.courseId, course.id));

    // Step 3: Fetch paginated reviews with user info
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
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, course.id))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return successResponse({
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    } satisfies PaginatedResponse<(typeof items)[number]>);
  } catch (error) {
    console.error("[GET /api/courses/[slug]/reviews]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
