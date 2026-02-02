import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { progress } from "@/db/schema/progress";
import { progressUpdateSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getDbUser } from "@/shared/lib/api/get-db-user";
import { verifyLessonEnrollment } from "@/shared/lib/api/enrollment-check";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = progressUpdateSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth
    const { dbUser, response } = await getDbUser();
    if (!dbUser) return response;

    // 3. Verify lesson exists and enrollment
    const enrollmentResult = await verifyLessonEnrollment(lessonId, dbUser.id);
    if (!enrollmentResult.enrolled) {
      if (!enrollmentResult.lessonExists)
        return errorResponse("NOT_FOUND", "Lesson not found", 404);
      return errorResponse("FORBIDDEN", "Not enrolled in this course", 403);
    }

    // 4. Build upsert values
    const values: {
      userId: string;
      lessonId: string;
      completed?: boolean;
      position?: number;
    } = {
      userId: dbUser.id,
      lessonId,
    };
    const setValues: {
      completed?: boolean;
      position?: number;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (parsed.data.completed !== undefined) {
      values.completed = parsed.data.completed;
      setValues.completed = parsed.data.completed;
    }
    if (parsed.data.position !== undefined) {
      values.position = parsed.data.position;
      setValues.position = parsed.data.position;
    }

    // 5. Upsert
    // TODO: Rate limiting -- progress auto-saves every 5s, so ~12 req/min per user is expected.
    const [result] = await db
      .insert(progress)
      .values(values)
      .onConflictDoUpdate({
        target: [progress.userId, progress.lessonId],
        set: setValues,
      })
      .returning({
        id: progress.id,
        completed: progress.completed,
        position: progress.position,
        updatedAt: progress.updatedAt,
      });

    return successResponse(result);
  } catch (error) {
    console.error("[PATCH /api/progress/[lessonId]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
