import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { reviews } from "@/db/schema/reviews";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { eq, and, sql, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Subquery: review stats for this course
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

    // Query 1: Course with review stats
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        longDescription: courses.longDescription,
        price: courses.price,
        level: courses.level,
        category: courses.category,
        thumbnailUrl: courses.thumbnailUrl,
        previewVideoUrl: courses.previewVideoUrl,
        instructorBio: courses.instructorBio,
        isFree: courses.isFree,
        reviewCount: sql<number>`coalesce(${reviewStats.reviewCount}, 0)`,
        averageRating: sql<number>`coalesce(${reviewStats.averageRating}, 0)`,
      })
      .from(courses)
      .leftJoin(reviewStats, eq(courses.id, reviewStats.courseId))
      .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
      .limit(1);

    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);

    // Query 2: Chapters with nested lessons (relational query)
    const chaptersWithLessons = await db.query.chapters.findMany({
      where: eq(chapters.courseId, course.id),
      orderBy: [asc(chapters.order)],
      columns: {
        id: true,
        title: true,
        order: true,
      },
      with: {
        lessons: {
          orderBy: [asc(lessons.order)],
          columns: {
            id: true,
            title: true,
            duration: true,
            isPreview: true,
            order: true,
            // NOTE: videoUrl deliberately excluded for public API
          },
        },
      },
    });

    // Compute totalDuration and totalLessons from fetched data
    let totalDuration = 0;
    let totalLessons = 0;
    for (const chapter of chaptersWithLessons) {
      totalLessons += chapter.lessons.length;
      for (const lesson of chapter.lessons) {
        totalDuration += lesson.duration ?? 0;
      }
    }

    const data = {
      ...course,
      totalDuration,
      totalLessons,
      chapters: chaptersWithLessons,
    };

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/courses/[slug]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
