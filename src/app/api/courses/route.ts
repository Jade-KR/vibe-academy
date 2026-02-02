import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { reviews } from "@/db/schema/reviews";
import { eq, and, sql } from "drizzle-orm";
import { courseListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = courseListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { category } = parsed.data;

    // Subquery for review aggregates per course
    const reviewStats = db
      .select({
        courseId: reviews.courseId,
        reviewCount: sql<number>`cast(count(*) as integer)`.as("review_count"),
        averageRating: sql<number>`round(coalesce(avg(${reviews.rating}), 0), 1)`.as(
          "average_rating",
        ),
      })
      .from(reviews)
      .groupBy(reviews.courseId)
      .as("review_stats");

    // Build filter conditions
    const conditions = [eq(courses.isPublished, true)];
    if (category) conditions.push(eq(courses.category, category));

    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        price: courses.price,
        level: courses.level,
        category: courses.category,
        thumbnailUrl: courses.thumbnailUrl,
        isFree: courses.isFree,
        reviewCount: sql<number>`coalesce(${reviewStats.reviewCount}, 0)`,
        averageRating: sql<number>`coalesce(${reviewStats.averageRating}, 0)`,
      })
      .from(courses)
      .leftJoin(reviewStats, eq(courses.id, reviewStats.courseId))
      .where(and(...conditions));

    return successResponse(result);
  } catch (error) {
    console.error("[GET /api/courses]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
