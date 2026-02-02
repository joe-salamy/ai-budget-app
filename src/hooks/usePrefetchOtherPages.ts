// usePrefetchOtherPages - Prefetch data for other pages in the background
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getAccounts } from "../services/accounts";
import { getCategories, getSubcategories } from "../services/categories";
import { getSpendingGoalsWithDetails } from "../services/goals";
import { getTransactionsWithDetails, getRecentActivityByAccount } from "../services/transactions";
import { useAuth } from "./useAuth";

/**
 * Custom hook that prefetches data for other pages (Goals, TransactionHistory, Add Transactions) in the background
 * after dashboard data is loaded. This makes navigating to those pages instant.
 *
 * Usage:
 * ```tsx
 * usePrefetchOtherPages(dashboardLoading);
 * ```
 */
export function usePrefetchOtherPages(dashboardLoading: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Only prefetch when user is logged in and dashboard has finished loading
    if (!user || dashboardLoading) return;

    // Prefetch accounts (used by Goals and TransactionHistory pages)
    queryClient.prefetchQuery({
      queryKey: queryKeys.accounts.list(),
      queryFn: async () => {
        const response = await getAccounts();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch accounts");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch categories (used by Goals and TransactionHistory pages)
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list(),
      queryFn: async () => {
        const response = await getCategories();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch categories");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch subcategories (used by Goals and TransactionHistory pages)
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.subcategories.list(),
      queryFn: async () => {
        const response = await getSubcategories();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch subcategories");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch spending goals (used by Goals page)
    queryClient.prefetchQuery({
      queryKey: queryKeys.goals.spending.list(),
      queryFn: async () => {
        const response = await getSpendingGoalsWithDetails();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch spending goals");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch transactions with no filters (used by TransactionHistory page)
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.list({}),
      queryFn: async () => {
        const response = await getTransactionsWithDetails({});
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch transactions");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch recent activity (used by Add Transactions page)
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.recentActivity(),
      queryFn: async () => {
        const response = await getRecentActivityByAccount();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch recent activity");
        }
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [dashboardLoading, user, queryClient]);
}
