// useTransactions hook - Fetch and manage transactions
import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  getTransactionsWithDetails,
  getRecentActivityByAccount,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  bulkUpdateTransactions,
} from "../services/transactions";
import { useAuth } from "./useAuth";
import type { Transaction } from "../types";
import type {
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  TransactionWithDetails,
} from "../services/transactions";

// ============== TYPES ==============

export interface RecentActivity {
  account_id: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  recent_transaction: Transaction | null;
}

interface UseTransactionsReturn {
  transactions: TransactionWithDetails[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  refresh: () => Promise<void>;
  addTransaction: (data: CreateTransactionData) => Promise<{ success: boolean; error?: string; data?: Transaction }>;
  addTransfer: (
    fromAccountId: string,
    toAccountId: string,
    date: string,
    name: string,
    amount: number,
    subcategoryId?: string | null,
    comment?: string | null
  ) => Promise<{ success: boolean; error?: string }>;
  editTransaction: (id: string, updates: UpdateTransactionData) => Promise<{ success: boolean; error?: string; data?: Transaction }>;
  removeTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkRemove: (ids: string[]) => Promise<{ success: boolean; error?: string; count?: number }>;
  bulkUpdateSubcategory: (ids: string[], subcategoryId: string | null) => Promise<{ success: boolean; error?: string; count?: number }>;
}

interface UseRecentActivityReturn {
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============== HOOKS ==============

/**
 * Custom hook for managing transactions with filtering
 *
 * Usage:
 * ```tsx
 * const { transactions, loading, filters, setFilters, addTransaction, ... } = useTransactions();
 * ```
 */
export function useTransactions(initialFilters?: TransactionFilters): UseTransactionsReturn {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  // Fetch transactions with current filters
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await getTransactionsWithDetails(filters);

    if (response.success && response.data) {
      setTransactions(response.data);
    } else {
      setError(response.error || "Failed to fetch transactions");
    }

    setLoading(false);
  }, [user, filters]);

  // Load transactions when auth is ready and user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchTransactions();
    } else if (!authLoading && !user) {
      setLoading(false);
      setTransactions([]);
    }
  }, [authLoading, user, fetchTransactions]);

  // Add a new transaction
  const addTransaction = useCallback(
    async (data: CreateTransactionData) => {
      const response = await createTransaction(data);

      if (response.success && response.data) {
        // Refresh to get the full details with joins
        await fetchTransactions();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchTransactions]
  );

  // Add a transfer (creates two transactions)
  const addTransfer = useCallback(
    async (
      fromAccountId: string,
      toAccountId: string,
      date: string,
      name: string,
      amount: number,
      subcategoryId?: string | null,
      comment?: string | null
    ) => {
      const response = await createTransfer(
        fromAccountId,
        toAccountId,
        date,
        name,
        amount,
        subcategoryId,
        comment
      );

      if (response.success) {
        // Refresh to get the full details
        await fetchTransactions();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchTransactions]
  );

  // Edit an existing transaction
  const editTransaction = useCallback(
    async (id: string, updates: UpdateTransactionData) => {
      const response = await updateTransaction(id, updates);

      if (response.success && response.data) {
        // Refresh to get updated details
        await fetchTransactions();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchTransactions]
  );

  // Remove a transaction (soft delete)
  const removeTransaction = useCallback(
    async (id: string) => {
      const response = await deleteTransaction(id);

      if (response.success) {
        // Optimistic update
        setTransactions((prev) => prev.filter((txn) => txn.id !== id));
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  // Bulk remove transactions
  const bulkRemove = useCallback(
    async (ids: string[]) => {
      const response = await bulkDeleteTransactions(ids);

      if (response.success) {
        // Optimistic update
        setTransactions((prev) => prev.filter((txn) => !ids.includes(txn.id)));
        return { success: true, count: response.count };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  // Bulk update subcategory
  const bulkUpdateSubcategory = useCallback(
    async (ids: string[], subcategoryId: string | null) => {
      const response = await bulkUpdateTransactions(ids, { subcategory_id: subcategoryId });

      if (response.success) {
        // Refresh to get updated details with joined data
        await fetchTransactions();
        return { success: true, count: response.count };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchTransactions]
  );

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchTransactions,
    addTransaction,
    addTransfer,
    editTransaction,
    removeTransaction,
    bulkRemove,
    bulkUpdateSubcategory,
  };
}

/**
 * Custom hook for getting recent activity for each account
 *
 * Usage:
 * ```tsx
 * const { recentActivity, loading, error, refresh } = useRecentActivity();
 * ```
 */
export function useRecentActivity(): UseRecentActivityReturn {
  const { user, loading: authLoading } = useAuth();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await getRecentActivityByAccount();

    if (response.success && response.data) {
      setRecentActivity(response.data);
    } else {
      setError(response.error || "Failed to fetch recent activity");
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRecentActivity();
    } else if (!authLoading && !user) {
      setLoading(false);
      setRecentActivity([]);
    }
  }, [authLoading, user, fetchRecentActivity]);

  return {
    recentActivity,
    loading,
    error,
    refresh: fetchRecentActivity,
  };
}

/**
 * Custom hook for simple transaction list (without joined details)
 * Use this when you just need basic transaction data
 */
export function useSimpleTransactions(initialFilters?: TransactionFilters) {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await getTransactions(filters);

    if (response.success && response.data) {
      setTransactions(response.data);
    } else {
      setError(response.error || "Failed to fetch transactions");
    }

    setLoading(false);
  }, [user, filters]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTransactions();
    } else if (!authLoading && !user) {
      setLoading(false);
      setTransactions([]);
    }
  }, [authLoading, user, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchTransactions,
  };
}
