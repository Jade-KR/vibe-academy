import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { payments } from "@/db/schema/payments";
import { enrollments } from "@/db/schema/enrollments";
import { users } from "@/db/schema/users";
import { eq, and, gte, sql } from "drizzle-orm";
import { adminAnalyticsQuerySchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { requireAdmin } from "@/shared/lib/api/admin-guard";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const parsed = adminAnalyticsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const { period } = parsed.data;

    // Compute cutoff date
    let cutoff: Date | null = null;
    if (period !== "all") {
      cutoff = new Date();
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      cutoff.setDate(cutoff.getDate() - days);
    }

    // Revenue stats (only completed payments)
    const revenueConditions = [eq(payments.status, "completed")];
    if (cutoff) revenueConditions.push(gte(payments.createdAt, cutoff));

    const [revenueStats] = await db
      .select({
        totalRevenue: sql<number>`coalesce(cast(sum(${payments.amount}) as integer), 0)`,
        totalPayments: sql<number>`cast(count(*) as integer)`,
        averagePayment: sql<number>`coalesce(cast(round(avg(${payments.amount})) as integer), 0)`,
      })
      .from(payments)
      .where(and(...revenueConditions));

    // Enrollment count in period
    const enrollmentConditions = [];
    if (cutoff) enrollmentConditions.push(gte(enrollments.purchasedAt, cutoff));

    const [enrollmentStats] = await db
      .select({
        totalEnrollments: sql<number>`cast(count(*) as integer)`,
      })
      .from(enrollments)
      .where(enrollmentConditions.length > 0 ? and(...enrollmentConditions) : undefined);

    // New user count in period
    const userConditions = [];
    if (cutoff) userConditions.push(gte(users.createdAt, cutoff));

    const [userStats] = await db
      .select({
        newUsers: sql<number>`cast(count(*) as integer)`,
      })
      .from(users)
      .where(userConditions.length > 0 ? and(...userConditions) : undefined);

    return successResponse({
      period,
      revenue: {
        total: revenueStats.totalRevenue,
        count: revenueStats.totalPayments,
        average: revenueStats.averagePayment,
      },
      enrollments: enrollmentStats.totalEnrollments,
      newUsers: userStats.newUsers,
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
