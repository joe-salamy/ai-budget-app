// useDashboard hook - Fetch and manage dashboard data
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { format, subDays } from "date-fns";
import {
  getAccountSummary,
  getCategorySummary,
  calculateNetWorth,
  getDashboardMetrics,
} from "../services/dashboard";
import { prepareNetWorthData, prepareSankeyData } from "../services/charts";
import { queryKeys } from "../lib/queryKeys";
import type { AccountSummary, CategorySummary, NetWorthSummary } from "../services/dashboard";
import type { NetWorthDataPoint, SankeyData } from "../services/charts";
import type { AccountType } from "../types";
import { useAuth } from "./useAuth";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

interface UseDashboardReturn {
  // Date range
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;

  // Account summary data
  accountSummary: AccountSummary[];
  accountSummaryLoading: boolean;
  accountSummaryError: string | null;

  // Category summary data
  categorySummary: CategorySummary[];
  categorySummaryLoading: boolean;
  categorySummaryError: string | null;
  hasUncategorizedTransactions: boolean;

  // Net worth data
  netWorth: NetWorthSummary | null;
  netWorthLoading: boolean;
  netWorthError: string | null;

  // Quick metrics
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;

  // Chart data
  netWorthChartData: NetWorthDataPoint[];
  netWorthChartAccounts: Array<{ name: string; type: AccountType }>;
  netWorthChartLoading: boolean;
  netWorthChartError: string | null;

  sankeyData: SankeyData | null;
  sankeyLoading: boolean;
  sankeyError: string | null;

  // Refresh functions
  refreshAccountSummary: () => Promise<void>;
  refreshCategorySummary: () => Promise<void>;
  refreshNetWorth: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshCharts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data
 *
 * Usage:
 * ```tsx
 * const {
 *   dateRange,
 *   setDateRange,
 *   accountSummary,
 *   categorySummary,
 *   netWorth,
 *   metrics,
 * } = useDashboard();
 * ```
 */
export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth();

  // Default to last 90 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 90);
    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  });

  // Query 1: Account Summary
  const {
    data: accountSummaryData,
    isLoading: accountSummaryLoading,
    error: accountSummaryQueryError,
    refetch: refetchAccountSummary,
  } = useQuery({
    queryKey: queryKeys.dashboard.accountSummary(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      const response = await getAccountSummary(dateRange.startDate, dateRange.endDate);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch account summary");
      }
      return { data: response.data || [], netWorth: response.netWorth || null };
    },
    enabled: !!user,
  });

  const accountSummary = accountSummaryData?.data || [];
  const netWorth = accountSummaryData?.netWorth || null;

  // Query 2: Category Summary
  const {
    data: categorySummaryData,
    isLoading: categorySummaryLoading,
    error: categorySummaryQueryError,
    refetch: refetchCategorySummary,
  } = useQuery({
    queryKey: queryKeys.dashboard.categorySummary(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      const response = await getCategorySummary(dateRange.startDate, dateRange.endDate);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch category summary");
      }
      return {
        data: response.data || [],
        hasUncategorizedTransactions: response.hasUncategorizedTransactions || false,
      };
    },
    enabled: !!user,
  });

  const categorySummary = categorySummaryData?.data || [];
  const hasUncategorizedTransactions = categorySummaryData?.hasUncategorizedTransactions || false;

  // Query 3: Metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsQueryError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: queryKeys.dashboard.metrics(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      const response = await getDashboardMetrics(dateRange.startDate, dateRange.endDate);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch metrics");
      }
      return response.data || null;
    },
    enabled: !!user,
  });

  // Query 4: Net Worth Chart
  const {
    data: netWorthChartDataResult,
    isLoading: netWorthChartLoading,
    error: netWorthChartQueryError,
    refetch: refetchNetWorthChart,
  } = useQuery({
    queryKey: queryKeys.dashboard.charts.netWorth(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      const response = await prepareNetWorthData(dateRange.startDate, dateRange.endDate);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch net worth chart data");
      }
      return { data: response.data || [], accounts: response.accounts || [] };
    },
    enabled: !!user,
  });

  const netWorthChartData = netWorthChartDataResult?.data || [];
  const netWorthChartAccounts = netWorthChartDataResult?.accounts || [];

  // Query 5: Sankey Chart
  const {
    data: sankeyData,
    isLoading: sankeyLoading,
    error: sankeyQueryError,
    refetch: refetchSankeyData,
  } = useQuery({
    queryKey: queryKeys.dashboard.charts.sankey(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      const response = await prepareSankeyData(dateRange.startDate, dateRange.endDate);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch Sankey chart data");
      }
      return response.data || null;
    },
    enabled: !!user,
  });

  // Refresh functions
  const refreshAccountSummary = async () => {
    await refetchAccountSummary();
  };

  const refreshCategorySummary = async () => {
    await refetchCategorySummary();
  };

  const refreshNetWorth = async () => {
    await refetchAccountSummary(); // Net worth comes from account summary
  };

  const refreshMetrics = async () => {
    await refetchMetrics();
  };

  const refreshCharts = async () => {
    await Promise.all([refetchNetWorthChart(), refetchSankeyData()]);
  };

  const refreshAll = async () => {
    await Promise.all([
      refetchAccountSummary(),
      refetchCategorySummary(),
      refetchMetrics(),
      refetchNetWorthChart(),
      refetchSankeyData(),
    ]);
  };

  // Error messages
  const accountSummaryError = accountSummaryQueryError?.message || null;
  const categorySummaryError = categorySummaryQueryError?.message || null;
  const netWorthError = accountSummaryQueryError?.message || null;
  const metricsError = metricsQueryError?.message || null;
  const netWorthChartError = netWorthChartQueryError?.message || null;
  const sankeyError = sankeyQueryError?.message || null;

  return {
    // Date range
    dateRange,
    setDateRange,

    // Account summary
    accountSummary,
    accountSummaryLoading,
    accountSummaryError,

    // Category summary
    categorySummary,
    categorySummaryLoading,
    categorySummaryError,
    hasUncategorizedTransactions,

    // Net worth
    netWorth,
    netWorthLoading: accountSummaryLoading,
    netWorthError,

    // Metrics
    metrics: metrics || null,
    metricsLoading,
    metricsError,

    // Chart data
    netWorthChartData,
    netWorthChartAccounts,
    netWorthChartLoading,
    netWorthChartError,
    sankeyData: sankeyData || null,
    sankeyLoading,
    sankeyError,

    // Refresh functions
    refreshAccountSummary,
    refreshCategorySummary,
    refreshNetWorth,
    refreshMetrics,
    refreshCharts,
    refreshAll,
  };
}
