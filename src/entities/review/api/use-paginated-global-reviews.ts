"use client";

import useSWR from "swr";
import { useState, useCallback, useEffect, useRef } from "react";
import type { PaginatedResponse } from "@/shared/types/api";
import type { GlobalReviewItem } from "./use-global-reviews";

/**
 * SWR hook with "load more" pagination for the global reviews feed.
 * Accumulates items from previous pages so the full list is always available.
 */
export function usePaginatedGlobalReviews(pageSize: number = 10) {
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<GlobalReviewItem[]>([]);
  const prevPageRef = useRef(1);

  const key = `/api/reviews?page=${page}&pageSize=${pageSize}`;
  const { data, error, isLoading } = useSWR(key);

  const paginated = (data?.data as PaginatedResponse<GlobalReviewItem>) ?? null;

  // When new data arrives for page > 1, append to accumulated items
  useEffect(() => {
    if (!paginated || !paginated.items) return;

    if (page === 1) {
      setAccumulated(paginated.items);
    } else if (page > prevPageRef.current) {
      setAccumulated((prev) => [...prev, ...paginated.items]);
    }
    prevPageRef.current = page;
  }, [paginated, page]);

  const loadMore = useCallback(() => {
    if (paginated?.hasMore) {
      setPage((p) => p + 1);
    }
  }, [paginated?.hasMore]);

  return {
    reviews: accumulated.length > 0 ? accumulated : (paginated?.items ?? []),
    total: paginated?.total ?? 0,
    hasMore: paginated?.hasMore ?? false,
    isLoading: page === 1 && isLoading,
    isLoadingMore: page > 1 && isLoading,
    error,
    loadMore,
  };
}
