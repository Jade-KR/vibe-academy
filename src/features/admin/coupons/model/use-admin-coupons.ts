"use client";

import useSWR from "swr";

export interface AdminCouponSummary {
  id: string;
  code: string;
  discount: number;
  discountType: "fixed" | "percentage";
  courseId: string | null;
  courseName: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export function useAdminCoupons(page: number = 1, pageSize: number = 20) {
  const key = `/api/admin/coupons?page=${page}&pageSize=${pageSize}`;

  const { data, error, isLoading, mutate } = useSWR(key);

  return {
    coupons: (data?.data?.items as AdminCouponSummary[]) ?? [],
    total: (data?.data?.total as number) ?? 0,
    page: (data?.data?.page as number) ?? page,
    pageSize: (data?.data?.pageSize as number) ?? pageSize,
    hasMore: (data?.data?.hasMore as boolean) ?? false,
    error,
    isLoading,
    mutate,
  };
}
