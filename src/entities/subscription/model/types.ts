import type { Subscription } from "@/db/schema";

/**
 * Subscription status enum - must match DB enum values exactly.
 * Source of truth: src/db/schema/enums.ts subscriptionStatusEnum
 */
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "incomplete"
  | "trialing";

/**
 * Plan identifiers matching pricing config.
 */
export type PlanId = "free" | "pro" | "enterprise";

/**
 * Billing interval for paid plans.
 */
export type BillingInterval = "monthly" | "yearly";

/**
 * Plan price for a specific interval.
 */
export interface PlanPrice {
  monthly: number;
  yearly: number;
}

/**
 * Feature limits per plan.
 */
export interface PlanLimits {
  apiCalls: number;
  storage: number; // in MB
}

/**
 * Full pricing plan configuration.
 */
export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: PlanPrice;
  features: string[];
  limits: PlanLimits;
  polarProductId?: string; // Only for paid plans
}

/**
 * Subscription with resolved plan info.
 * Used by frontend to display subscription details.
 */
export interface SubscriptionWithPlan extends Subscription {
  plan: PricingPlan;
}

/**
 * Request body for POST /api/payments/checkout.
 */
export interface CheckoutRequest {
  planId: PlanId;
  interval: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout response data.
 */
export interface CheckoutResponse {
  checkoutUrl: string;
}

/**
 * Subscription management actions.
 * Request body for POST /api/payments/subscription.
 */
export interface SubscriptionActionRequest {
  action: "cancel" | "resume" | "change_plan";
  planId?: PlanId; // Required when action is 'change_plan'
  interval?: BillingInterval; // Required when action is 'change_plan'
}
