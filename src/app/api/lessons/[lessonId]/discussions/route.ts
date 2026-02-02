import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { discussions } from "@/db/schema/discussions";
import { comments } from "@/db/schema/comments";
import { users } from "@/db/schema/users";
import { eq, desc, sql } from "drizzle-orm";
import { createDiscussionSchema, discussionListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";
import { verifyLessonEnrollment } from "@/shared/lib/api/enrollment-check";
import type { PaginatedResponse } from "@/shared/types";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;

    // 1. Parse query params
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = discussionListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { page, pageSize } = parsed.data;

    // 2. Auth + enrollment check
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    const enrollmentResult = await verifyLessonEnrollment(lessonId, dbUser.id);
    if (!enrollmentResult.enrolled) {
      if (!enrollmentResult.lessonExists)
        return errorResponse("NOT_FOUND", "Lesson not found", 404);
      return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);
    }

    // 3. Count total discussions
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(discussions)
      .where(eq(discussions.lessonId, lessonId));

    // 4. Fetch paginated discussions with user info and comment count
    const commentCountSq = db
      .select({
        discussionId: comments.discussionId,
        count: sql<number>`cast(count(*) as integer)`.as("comment_count"),
      })
      .from(comments)
      .groupBy(comments.discussionId)
      .as("comment_counts");

    const items = await db
      .select({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        createdAt: discussions.createdAt,
        updatedAt: discussions.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        commentCount: sql<number>`coalesce(${commentCountSq.count}, 0)`,
      })
      .from(discussions)
      .innerJoin(users, eq(discussions.userId, users.id))
      .leftJoin(commentCountSq, eq(discussions.id, commentCountSq.discussionId))
      .where(eq(discussions.lessonId, lessonId))
      .orderBy(desc(discussions.createdAt))
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
    console.error("[GET /api/lessons/[lessonId]/discussions]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = createDiscussionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth + enrollment check
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    const enrollmentResult = await verifyLessonEnrollment(lessonId, dbUser.id);
    if (!enrollmentResult.enrolled) {
      if (!enrollmentResult.lessonExists)
        return errorResponse("NOT_FOUND", "Lesson not found", 404);
      return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);
    }

    // 3. TODO: Rate limiting for discussion creation

    // 4. Insert
    const [created] = await db
      .insert(discussions)
      .values({
        lessonId,
        userId: dbUser.id,
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .returning({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        createdAt: discussions.createdAt,
      });

    return successResponse(created, "Discussion created", 201);
  } catch (error) {
    console.error("[POST /api/lessons/[lessonId]/discussions]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
