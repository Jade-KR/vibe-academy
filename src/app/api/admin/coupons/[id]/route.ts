import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { coupons } from "@/db/schema/coupons";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { requireAdmin, parseUuid } from "@/shared/lib/api/admin-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const validId = parseUuid(id);
    if (!validId) return errorResponse("BAD_REQUEST", "Invalid ID format", 400);

    const { dbUser, response } = await requireAdmin();
    if (!dbUser) return response;

    const [deleted] = await db
      .delete(coupons)
      .where(eq(coupons.id, validId))
      .returning({ id: coupons.id });

    if (!deleted) return errorResponse("NOT_FOUND", "Coupon not found", 404);

    return successResponse(null, "Coupon deleted");
  } catch (error) {
    console.error("[DELETE /api/admin/coupons/[id]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
