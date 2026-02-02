import type { PricingPlan, PlanId } from "../model/types";

/**
 * Pricing plans configuration.
 * Source: PRD section 4.2.1
 *
 * Prices are in KRW.
 * Storage limits are in MB (-1 = unlimited).
 * API call limits are per month (-1 = unlimited).
 */
export const PRICING_PLANS: Record<Uppercase<PlanId>, PricingPlan> = {
  FREE: {
    id: "free",
    name: "Free",
    description: "시작하기 좋은 무료 플랜",
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: ["기본 기능 접근", "월 100회 API 호출", "커뮤니티 지원"],
    limits: {
      apiCalls: 100,
      storage: 100,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description: "성장하는 팀을 위한 플랜",
    polarProductId: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID,
    price: {
      monthly: 19_000,
      yearly: 190_000,
    },
    features: ["모든 기능 접근", "월 10,000회 API 호출", "우선 지원", "고급 분석"],
    limits: {
      apiCalls: 10_000,
      storage: 10_240,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "대규모 조직을 위한 플랜",
    polarProductId: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID,
    price: {
      monthly: 99_000,
      yearly: 990_000,
    },
    features: ["무제한 기능", "무제한 API 호출", "전담 지원", "맞춤 기능 개발", "SLA 보장"],
    limits: {
      apiCalls: -1,
      storage: -1,
    },
  },
} as const;

/** All available plan IDs in display order. */
export const PLAN_IDS: PlanId[] = ["free", "pro", "enterprise"];

/**
 * Look up a pricing plan by its ID.
 * Returns undefined if the plan ID is not found.
 */
export function getPlanById(planId: PlanId): PricingPlan | undefined {
  return Object.values(PRICING_PLANS).find((plan) => plan.id === planId);
}

/**
 * Get all plans that have a Polar product ID (i.e., paid plans).
 */
export function getPaidPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS).filter((plan) => plan.polarProductId !== undefined);
}

/**
 * Get all plans in display order.
 */
export function getAllPlans(): PricingPlan[] {
  return PLAN_IDS.map((id) => getPlanById(id)!);
}
