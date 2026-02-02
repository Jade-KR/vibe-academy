import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { comments } from "@/db/schema/comments";
import { discussions } from "@/db/schema/discussions";
import { lessons } from "@/db/schema/lessons";
import { chapters } from "@/db/schema/chapters";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and } from "drizzle-orm";
import { createCommentSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";

type RouteContext = {
  params: Promise<{ discussionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { discussionId } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 3. Find discussion -> lesson -> chapter -> verify enrollment
    const [discussion] = await db
      .select({ id: discussions.id, lessonId: discussions.lessonId })
      .from(discussions)
      .where(eq(discussions.id, discussionId))
      .limit(1);
    if (!discussion) return errorResponse("NOT_FOUND", "Discussion not found", 404);

    const [lesson] = await db
      .select({ chapterId: lessons.chapterId })
      .from(lessons)
      .where(eq(lessons.id, discussion.lessonId))
      .limit(1);
    if (!lesson) return errorResponse("NOT_FOUND", "Lesson not found", 404);

    const [chapter] = await db
      .select({ courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, lesson.chapterId))
      .limit(1);
    if (!chapter) return errorResponse("NOT_FOUND", "Chapter not found", 404);

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, chapter.courseId)))
      .limit(1);
    if (!enrollment) return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);

    // 4. Insert comment
    const [created] = await db
      .insert(comments)
      .values({
        discussionId,
        userId: dbUser.id,
        content: parsed.data.content,
      })
      .returning({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
      });

    return successResponse(created, "Comment created", 201);
  } catch (error) {
    console.error("[POST /api/discussions/[discussionId]/comments]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
