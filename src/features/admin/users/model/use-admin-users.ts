"use client";

import useSWR from "swr";

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  enrollmentCount: number;
}

interface UseAdminUsersParams {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(params: UseAdminUsersParams = {}) {
  const { search, role, page = 1, pageSize = 20 } = params;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(pageSize));
  if (search) searchParams.set("search", search);
  if (role) searchParams.set("role", role);

  const key = `/api/admin/users?${searchParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(key);

  return {
    users: (data?.data?.items as AdminUserSummary[]) ?? [],
    total: (data?.data?.total as number) ?? 0,
    page: (data?.data?.page as number) ?? page,
    pageSize: (data?.data?.pageSize as number) ?? pageSize,
    hasMore: (data?.data?.hasMore as boolean) ?? false,
    error,
    isLoading,
    mutate,
  };
}
