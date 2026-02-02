"use client";

import useSWR from "swr";
import type { UserProfile } from "../model/types";

/**
 * SWR hook to fetch the current user's profile.
 * Uses the global SWR fetcher configured in SWRProvider.
 *
 * The API returns { data: UserProfile } via successResponse().
 */
export function useUser() {
  const { data, error, isLoading } = useSWR("/api/user/profile");

  return {
    user: (data?.data as UserProfile) ?? null,
    error,
    isLoading,
  };
}
