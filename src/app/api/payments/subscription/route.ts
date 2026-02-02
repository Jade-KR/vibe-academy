import { NextRequest } from "next/server";
import { polar } from "@/shared/api/polar/client";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { subscriptions } from "@/db/schema/subscriptions";
import { eq } from "drizzle-orm";
import { subscriptionActionSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";
import { getPlanById } from "@/entities/subscription";

const subscriptionColumns = {
  id: subscriptions.id,
  planId: subscriptions.planId,
  status: subscriptions.status,
  polarSubscriptionId: subscriptions.polarSubscriptionId,
  polarCustomerId: subscriptions.polarCustomerId,
  currentPeriodStart: subscriptions.currentPeriodStart,
  currentPeriodEnd: subscriptions.currentPeriodEnd,
  cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
  createdAt: subscriptions.createdAt,
  updatedAt: subscriptions.updatedAt,
} as const;

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.supabaseUserId, user.id));

    if (!dbUser) return errorResponse("NOT_FOUND", "User not found", 404);

    const [subscription] = await db
      .select(subscriptionColumns)
      .from(subscriptions)
      .where(eq(subscriptions.userId, dbUser.id));

    // If no subscription, return free plan default
    if (!subscription) {
      return successResponse({
        planId: "free",
        status: "active",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    return successResponse(subscription);
  } catch (error) {
    console.error("[GET /api/payments/subscription]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = subscriptionActionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.supabaseUserId, user.id));

    if (!dbUser) return errorResponse("NOT_FOUND", "User not found", 404);

    const [subscription] = await db
      .select(subscriptionColumns)
      .from(subscriptions)
      .where(eq(subscriptions.userId, dbUser.id));

    if (!subscription || !subscription.polarSubscriptionId) {
      return errorResponse("NOT_FOUND", "No active subscription found", 404);
    }

    const { action } = parsed.data;

    if (action === "cancel") {
      await polar.subscriptions.update({
        id: subscription.polarSubscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });

      const [updated] = await db
        .update(subscriptions)
        .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscription.id))
        .returning(subscriptionColumns);

      return successResponse(updated, "Subscription will be canceled at period end");
    }

    if (action === "resume") {
      await polar.subscriptions.update({
        id: subscription.polarSubscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: false },
      });

      const [updated] = await db
        .update(subscriptions)
        .set({ cancelAtPeriodEnd: false, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscription.id))
        .returning(subscriptionColumns);

      return successResponse(updated, "Subscription resumed");
    }

    // action === "change_plan"
    const newPlan = getPlanById(parsed.data.planId);
    if (!newPlan?.polarProductId) {
      return errorResponse("BAD_REQUEST", "Selected plan is not available", 400);
    }

    await polar.subscriptions.update({
      id: subscription.polarSubscriptionId,
      subscriptionUpdate: { productId: newPlan.polarProductId },
    });

    const [updated] = await db
      .update(subscriptions)
      .set({ planId: parsed.data.planId, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscription.id))
      .returning(subscriptionColumns);

    return successResponse(updated, "Plan changed successfully");
  } catch (error) {
    console.error("[POST /api/payments/subscription]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
