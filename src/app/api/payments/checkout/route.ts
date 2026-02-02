import { NextRequest } from "next/server";
import { polar } from "@/shared/api/polar/client";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { checkoutSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";
import { getPlanById } from "@/entities/subscription";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const plan = getPlanById(parsed.data.planId);
    if (!plan?.polarProductId) {
      return errorResponse("BAD_REQUEST", "Selected plan is not available for purchase", 400);
    }

    // Look up internal user for email
    const [dbUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.supabaseUserId, user.id));

    if (!dbUser) return errorResponse("NOT_FOUND", "User not found", 404);

    const checkout = await polar.checkouts.create({
      products: [plan.polarProductId],
      successUrl:
        parsed.data.successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      customerEmail: dbUser.email,
      metadata: {
        userId: dbUser.id,
        planId: parsed.data.planId,
        interval: parsed.data.interval,
      },
    });

    return successResponse({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("[POST /api/payments/checkout]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
