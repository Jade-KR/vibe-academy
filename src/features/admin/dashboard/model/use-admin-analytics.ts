"use client";

import useSWR from "swr";

export interface AnalyticsData {
  period: string;
  revenue: { total: number; count: number; average: number };
  enrollments: number;
  newUsers: number;
}

export function useAdminAnalytics(period: string = "30d") {
  const { data, error, isLoading } = useSWR(`/api/admin/analytics?period=${period}`);
  return {
    analytics: (data?.data as AnalyticsData) ?? null,
    error,
    isLoading,
  };
}
