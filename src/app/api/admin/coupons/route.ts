import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { coupons } from "@/db/schema/coupons";
import { courses } from "@/db/schema/courses";
import { eq, desc, sql } from "drizzle-orm";
import { createCouponSchema, couponListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
    }

    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    // Check code uniqueness
    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, parsed.data.code))
      .limit(1);
    if (existing) {
      return errorResponse("CONFLICT", "A coupon with this code already exists", 409);
    }

    // If courseId provided, verify course exists
    if (parsed.data.courseId) {
      const [course] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.id, parsed.data.courseId))
        .limit(1);
      if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);
    }

    const [created] = await db
      .insert(coupons)
      .values({
        code: parsed.data.code,
        discount: parsed.data.discount,
        discountType: parsed.data.discountType,
        courseId: parsed.data.courseId ?? null,
        maxUses: parsed.data.maxUses ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      })
      .returning({
        id: coupons.id,
        code: coupons.code,
        discount: coupons.discount,
        discountType: coupons.discountType,
        courseId: coupons.courseId,
        maxUses: coupons.maxUses,
        expiresAt: coupons.expiresAt,
        createdAt: coupons.createdAt,
      });

    return successResponse(created, "Coupon created", 201);
  } catch (error) {
    console.error("[POST /api/admin/coupons]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryParsed = couponListQuerySchema.safeParse(searchParams);
    if (!queryParsed.success) return zodErrorResponse(queryParsed.error);

    const { page, pageSize } = queryParsed.data;
    const offset = (page - 1) * pageSize;

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(coupons);

    const items = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        discount: coupons.discount,
        discountType: coupons.discountType,
        courseId: coupons.courseId,
        maxUses: coupons.maxUses,
        usedCount: coupons.usedCount,
        expiresAt: coupons.expiresAt,
        createdAt: coupons.createdAt,
        courseName: sql<string | null>`${courses.title}`,
      })
      .from(coupons)
      .leftJoin(courses, eq(coupons.courseId, courses.id))
      .orderBy(desc(coupons.createdAt))
      .limit(pageSize)
      .offset(offset);

    return successResponse({
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    });
  } catch (error) {
    console.error("[GET /api/admin/coupons]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
