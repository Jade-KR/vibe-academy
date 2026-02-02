import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { adminUserListQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = adminUserListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const { page, pageSize, role, search } = parsed.data;

    // Build conditions
    const conditions = [];
    if (role) conditions.push(eq(users.role, role));
    if (search) {
      conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(whereClause);

    // Enrollment count subquery
    const enrollmentCount = db
      .select({
        userId: enrollments.userId,
        count: sql<number>`cast(count(*) as integer)`.as("enrollment_count"),
      })
      .from(enrollments)
      .groupBy(enrollments.userId)
      .as("enrollment_count");

    // Fetch users
    const items = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
        enrollmentCount: sql<number>`coalesce(${enrollmentCount.count}, 0)`,
      })
      .from(users)
      .leftJoin(enrollmentCount, eq(users.id, enrollmentCount.userId))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return successResponse({ items, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
