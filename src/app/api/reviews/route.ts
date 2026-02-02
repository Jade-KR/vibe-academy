import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { reviews } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { progress } from "@/db/schema/progress";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { reviewListQuerySchema, createReviewSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

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

export async function POST(request: NextRequest) {
  try {
    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // TODO: Rate limiting for review creation

    // 3. Verify enrollment
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, parsed.data.courseId)))
      .limit(1);
    if (!enrollment) return errorResponse("FORBIDDEN", "Must be enrolled to review", 403);

    // 4. Check >= 50% progress
    const [{ totalLessons }] = await db
      .select({ totalLessons: sql<number>`cast(count(*) as integer)` })
      .from(lessons)
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(eq(chapters.courseId, parsed.data.courseId));

    const [{ completedLessons }] = await db
      .select({ completedLessons: sql<number>`cast(count(*) as integer)` })
      .from(progress)
      .innerJoin(lessons, eq(progress.lessonId, lessons.id))
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(
        and(
          eq(progress.userId, dbUser.id),
          eq(chapters.courseId, parsed.data.courseId),
          eq(progress.completed, true),
        ),
      );

    if (totalLessons > 0 && completedLessons / totalLessons < 0.5) {
      return errorResponse(
        "FORBIDDEN",
        "Must complete at least 50% of lessons to write a review",
        403,
      );
    }

    // 5. Check unique constraint (one review per user per course)
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, dbUser.id), eq(reviews.courseId, parsed.data.courseId)))
      .limit(1);
    if (existingReview) {
      return errorResponse("CONFLICT", "You have already reviewed this course", 409);
    }

    // 6. Insert review
    const [created] = await db
      .insert(reviews)
      .values({
        userId: dbUser.id,
        courseId: parsed.data.courseId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .returning({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        createdAt: reviews.createdAt,
      });

    return successResponse(created, "Review created", 201);
  } catch (error) {
    console.error("[POST /api/reviews]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
