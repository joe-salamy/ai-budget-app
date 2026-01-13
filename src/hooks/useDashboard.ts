// useDashboard hook - Fetch and manage dashboard data
import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import {
  getAccountSummary,
  getCategorySummary,
  calculateNetWorth,
  getDashboardMetrics,
} from "../services/dashboard";
import type {
  AccountSummary,
  CategorySummary,
  NetWorthSummary,
} from "../services/dashboard";
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
  setDateRange: (range: DateRange) => void;

  // Account summary data
  accountSummary: AccountSummary[];
  accountSummaryLoading: boolean;
  accountSummaryError: string | null;

  // Category summary data
  categorySummary: CategorySummary[];
  categorySummaryLoading: boolean;
  categorySummaryError: string | null;

  // Net worth data
  netWorth: NetWorthSummary | null;
  netWorthLoading: boolean;
  netWorthError: string | null;

  // Quick metrics
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;

  // Refresh functions
  refreshAccountSummary: () => Promise<void>;
  refreshCategorySummary: () => Promise<void>;
  refreshNetWorth: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
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
  const { user, loading: authLoading } = useAuth();

  // Default to last 90 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 90);
    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  });

  // Account summary state
  const [accountSummary, setAccountSummary] = useState<AccountSummary[]>([]);
  const [accountSummaryLoading, setAccountSummaryLoading] = useState<boolean>(true);
  const [accountSummaryError, setAccountSummaryError] = useState<string | null>(null);

  // Category summary state
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [categorySummaryLoading, setCategorySummaryLoading] = useState<boolean>(true);
  const [categorySummaryError, setCategorySummaryError] = useState<string | null>(null);

  // Net worth state
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [netWorthLoading, setNetWorthLoading] = useState<boolean>(true);
  const [netWorthError, setNetWorthError] = useState<string | null>(null);

  // Metrics state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Fetch account summary
  const fetchAccountSummary = useCallback(async () => {
    if (!user) {
      setAccountSummaryLoading(false);
      return;
    }

    setAccountSummaryLoading(true);
    setAccountSummaryError(null);

    const response = await getAccountSummary(dateRange.startDate, dateRange.endDate);

    if (response.success) {
      setAccountSummary(response.data || []);
      if (response.netWorth) {
        setNetWorth(response.netWorth);
      }
    } else {
      setAccountSummaryError(response.error || "Failed to fetch account summary");
    }

    setAccountSummaryLoading(false);
  }, [user, dateRange.startDate, dateRange.endDate]);

  // Fetch category summary
  const fetchCategorySummary = useCallback(async () => {
    if (!user) {
      setCategorySummaryLoading(false);
      return;
    }

    setCategorySummaryLoading(true);
    setCategorySummaryError(null);

    const response = await getCategorySummary(dateRange.startDate, dateRange.endDate);

    if (response.success) {
      setCategorySummary(response.data || []);
    } else {
      setCategorySummaryError(response.error || "Failed to fetch category summary");
    }

    setCategorySummaryLoading(false);
  }, [user, dateRange.startDate, dateRange.endDate]);

  // Fetch net worth
  const fetchNetWorth = useCallback(async () => {
    if (!user) {
      setNetWorthLoading(false);
      return;
    }

    setNetWorthLoading(true);
    setNetWorthError(null);

    const response = await calculateNetWorth(dateRange.endDate);

    if (response.success) {
      setNetWorth(response.data || null);
    } else {
      setNetWorthError(response.error || "Failed to calculate net worth");
    }

    setNetWorthLoading(false);
  }, [user, dateRange.endDate]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetricsLoading(false);
      return;
    }

    setMetricsLoading(true);
    setMetricsError(null);

    const response = await getDashboardMetrics(dateRange.startDate, dateRange.endDate);

    if (response.success) {
      setMetrics(response.data || null);
    } else {
      setMetricsError(response.error || "Failed to fetch metrics");
    }

    setMetricsLoading(false);
  }, [user, dateRange.startDate, dateRange.endDate]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchAccountSummary(),
      fetchCategorySummary(),
      fetchMetrics(),
    ]);
  }, [fetchAccountSummary, fetchCategorySummary, fetchMetrics]);

  // Load data when auth is ready and date range changes
  useEffect(() => {
    if (!authLoading && user) {
      refreshAll();
    } else if (!authLoading && !user) {
      setAccountSummaryLoading(false);
      setCategorySummaryLoading(false);
      setNetWorthLoading(false);
      setMetricsLoading(false);
      setAccountSummary([]);
      setCategorySummary([]);
      setNetWorth(null);
      setMetrics(null);
    }
  }, [authLoading, user, dateRange.startDate, dateRange.endDate, refreshAll]);

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

    // Net worth
    netWorth,
    netWorthLoading,
    netWorthError,

    // Metrics
    metrics,
    metricsLoading,
    metricsError,

    // Refresh functions
    refreshAccountSummary: fetchAccountSummary,
    refreshCategorySummary: fetchCategorySummary,
    refreshNetWorth: fetchNetWorth,
    refreshMetrics: fetchMetrics,
    refreshAll,
  };
}
