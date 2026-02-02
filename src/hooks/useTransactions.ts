// useTransactions hook - Fetch and manage transactions
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getTransactions,
  getTransactionsWithDetails,
  getRecentActivityByAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  bulkUpdateTransactions,
} from "../services/transactions";
import { useAuth } from "./useAuth";
import { queryKeys } from "../lib/queryKeys";
import { toast } from "sonner";
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
  addTransaction: (
    data: CreateTransactionData
  ) => Promise<{ success: boolean; error?: string; data?: Transaction }>;
  editTransaction: (
    id: string,
    updates: UpdateTransactionData
  ) => Promise<{ success: boolean; error?: string; data?: Transaction }>;
  removeTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkRemove: (ids: string[]) => Promise<{ success: boolean; error?: string; count?: number }>;
  bulkUpdateSubcategory: (
    ids: string[],
    subcategoryId: string | null
  ) => Promise<{ success: boolean; error?: string; count?: number }>;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  // Read query with filters
  const {
    data: transactions = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => {
      const response = await getTransactionsWithDetails(filters);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch transactions");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      return await createTransaction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTransactionData }) => {
      return await updateTransaction(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteTransaction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await bulkDeleteTransactions(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, subcategoryId }: { ids: string[]; subcategoryId: string | null }) => {
      return await bulkUpdateTransactions(ids, { subcategory_id: subcategoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  // Wrapper functions to maintain interface
  const addTransaction = async (data: CreateTransactionData) => {
    const result = await addTransactionMutation.mutateAsync(data);
    if (result.success) {
      toast.success("Transaction created", { description: "Your transaction has been added successfully" });
    } else {
      toast.error("Failed to create transaction", { description: result.error || "An error occurred" });
    }
    return result;
  };

  const editTransaction = async (id: string, updates: UpdateTransactionData) => {
    const result = await updateTransactionMutation.mutateAsync({ id, updates });
    if (result.success) {
      toast.success("Transaction updated", { description: "Your changes have been saved" });
    } else {
      toast.error("Failed to update transaction", { description: result.error || "An error occurred" });
    }
    return result;
  };

  const removeTransaction = async (id: string) => {
    const result = await deleteTransactionMutation.mutateAsync(id);
    if (result.success) {
      toast.success("Transaction deleted", { description: "The transaction has been removed" });
    } else {
      toast.error("Failed to delete transaction", { description: result.error || "An error occurred" });
    }
    return result;
  };

  const bulkRemove = async (ids: string[]) => {
    const result = await bulkDeleteMutation.mutateAsync(ids);
    if (result.success) {
      toast.success("Transactions deleted", { description: `${result.count} transactions have been removed` });
    } else {
      toast.error("Failed to delete transactions", { description: result.error || "An error occurred" });
    }
    return result;
  };

  const bulkUpdateSubcategory = async (ids: string[], subcategoryId: string | null) => {
    const result = await bulkUpdateMutation.mutateAsync({ ids, subcategoryId });
    if (result.success) {
      toast.success("Categories updated", { description: `${result.count} transactions have been updated` });
    } else {
      toast.error("Failed to update categories", { description: result.error || "An error occurred" });
    }
    return result;
  };

  const refresh = async () => {
    await refetch();
  };

  return {
    transactions,
    loading,
    error: queryError?.message || null,
    filters,
    setFilters,
    refresh,
    addTransaction,
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
  const { user } = useAuth();

  const {
    data: recentActivity = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.transactions.recentActivity(),
    queryFn: async () => {
      const response = await getRecentActivityByAccount();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch recent activity");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  const refresh = async () => {
    await refetch();
  };

  return {
    recentActivity,
    loading,
    error: queryError?.message || null,
    refresh,
  };
}

/**
 * Custom hook for simple transaction list (without joined details)
 * Use this when you just need basic transaction data
 */
export function useSimpleTransactions(initialFilters?: TransactionFilters) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  const {
    data: transactions = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.transactions.all, "simple", filters],
    queryFn: async () => {
      const response = await getTransactions(filters);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch transactions");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  const refresh = async () => {
    await refetch();
  };

  return {
    transactions,
    loading,
    error: queryError?.message || null,
    filters,
    setFilters,
    refresh,
  };
}
