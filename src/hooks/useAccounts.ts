// useAccounts hook - Fetch and manage accounts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../services/accounts";
import { useAuth } from "./useAuth";
import { queryKeys } from "../lib/queryKeys";
import type { Account, AccountType } from "../types";

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAccount: (
    name: string,
    type: AccountType,
    initialBalance: number
  ) => Promise<{ success: boolean; error?: string; data?: Account }>;
  editAccount: (
    id: string,
    updates: { name?: string; type?: AccountType; initial_balance?: number }
  ) => Promise<{ success: boolean; error?: string; data?: Account }>;
  removeAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for managing accounts
 *
 * Usage:
 * ```tsx
 * const { accounts, loading, error, refresh, addAccount, editAccount, removeAccount } = useAccounts();
 * ```
 */
export function useAccounts(): UseAccountsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Read query
  const {
    data: accounts = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: async () => {
      const response = await getAccounts();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch accounts");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (data: { name: string; type: AccountType; initial_balance: number }) => {
      return await createAccount(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; type?: AccountType; initial_balance?: number };
    }) => {
      return await updateAccount(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Wrapper functions to maintain interface
  const addAccount = async (name: string, type: AccountType, initialBalance: number) => {
    const result = await addMutation.mutateAsync({
      name,
      type,
      initial_balance: initialBalance,
    });
    return result;
  };

  const editAccount = async (
    id: string,
    updates: { name?: string; type?: AccountType; initial_balance?: number }
  ) => {
    const result = await updateMutation.mutateAsync({ id, updates });
    return result;
  };

  const removeAccount = async (id: string) => {
    const result = await deleteMutation.mutateAsync(id);
    return result;
  };

  const refresh = async () => {
    await refetch();
  };

  return {
    accounts,
    loading,
    error: queryError?.message || null,
    refresh,
    addAccount,
    editAccount,
    removeAccount,
  };
}
