import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { enrollments } from "@/db/schema/enrollments";
import { courses } from "@/db/schema/courses";
import { lessons } from "@/db/schema/lessons";
import { chapters } from "@/db/schema/chapters";
import { progress } from "@/db/schema/progress";
import { eq, and, desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

export async function GET(_request: NextRequest) {
  try {
    // 1. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 2. Get enrollments with course info
    const myEnrollments = await db
      .select({
        id: enrollments.id,
        purchasedAt: enrollments.purchasedAt,
        course: {
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          thumbnailUrl: courses.thumbnailUrl,
          level: courses.level,
        },
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, dbUser.id))
      .orderBy(desc(enrollments.purchasedAt));

    // 3. For each enrollment, compute progress percentage
    const data = await Promise.all(
      myEnrollments.map(async (enrollment) => {
        const [stats] = await db
          .select({
            totalLessons: sql<number>`cast(count(distinct ${lessons.id}) as integer)`,
            completedLessons: sql<number>`cast(count(distinct case when ${progress.completed} = true then ${progress.lessonId} end) as integer)`,
          })
          .from(lessons)
          .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
          .leftJoin(
            progress,
            and(eq(progress.lessonId, lessons.id), eq(progress.userId, dbUser.id)),
          )
          .where(eq(chapters.courseId, enrollment.course.id));

        const totalLessons = stats?.totalLessons ?? 0;
        const completedLessons = stats?.completedLessons ?? 0;

        return {
          ...enrollment,
          progressPercent:
            totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          completedLessons,
          totalLessons,
        };
      }),
    );

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/enrollments]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
