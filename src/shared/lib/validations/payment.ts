import { z } from "zod";

/**
 * POST /api/payments/checkout
 * Matches CheckoutRequest from entities/subscription/model/types.ts
 */
export const checkoutSchema = z.object({
  planId: z.enum(["pro", "enterprise"]), // "free" excluded - no checkout needed
  interval: z.enum(["monthly", "yearly"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/payments/subscription
 * Matches SubscriptionActionRequest from entities/subscription/model/types.ts
 */
export const subscriptionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
  }),
  z.object({
    action: z.literal("resume"),
  }),
  z.object({
    action: z.literal("change_plan"),
    planId: z.enum(["pro", "enterprise"]),
    interval: z.enum(["monthly", "yearly"]),
  }),
]);
