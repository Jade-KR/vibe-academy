"use client";

import useSWR from "swr";
import type { Subscription } from "@/db/schema";

/**
 * SWR hook to fetch the current user's subscription.
 * Uses the global SWR fetcher configured in SWRProvider.
 *
 * The API returns { data: Subscription } via successResponse().
 * Returns a free-plan default when no subscription exists.
 */
export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR("/api/payments/subscription");

  const subscription = (data?.data as Subscription) ?? null;

  return {
    subscription,
    error,
    isLoading,
    isPro: subscription?.planId === "pro" || subscription?.planId === "enterprise",
    mutate,
  };
}
