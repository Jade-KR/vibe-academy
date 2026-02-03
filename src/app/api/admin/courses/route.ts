import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { chapters } from "@/db/schema/chapters";
import { lessons } from "@/db/schema/lessons";
import { eq, desc, sql } from "drizzle-orm";
import { createCourseSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

export async function GET() {
  try {
    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        price: courses.price,
        level: courses.level,
        category: courses.category,
        isPublished: courses.isPublished,
        isFree: courses.isFree,
        createdAt: courses.createdAt,
        chapterCount: sql<number>`cast((SELECT count(*) FROM ${chapters} WHERE ${chapters.courseId} = ${courses.id}) as integer)`,
        lessonCount: sql<number>`cast((SELECT count(*) FROM ${lessons} l JOIN ${chapters} c ON l.${lessons.chapterId} = c.${chapters.id} WHERE c.${chapters.courseId} = ${courses.id}) as integer)`,
      })
      .from(courses)
      .orderBy(desc(courses.createdAt));

    return successResponse({ items: result, total: result.length });
  } catch (error) {
    console.error("[GET /api/admin/courses]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
    }

    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, parsed.data.slug))
      .limit(1);
    if (existing) {
      return errorResponse("CONFLICT", "A course with this slug already exists", 409);
    }

    const [created] = await db.insert(courses).values(parsed.data).returning({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      isPublished: courses.isPublished,
      createdAt: courses.createdAt,
    });

    return successResponse(created, "Course created", 201);
  } catch (error) {
    console.error("[POST /api/admin/courses]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
