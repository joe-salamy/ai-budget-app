// useAccounts hook - Fetch and manage accounts
import { useState, useEffect, useCallback } from "react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../services/accounts";
import { useAuth } from "./useAuth";
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
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await getAccounts();

    if (response.success && response.data) {
      setAccounts(response.data);
    } else {
      setError(response.error || "Failed to fetch accounts");
    }

    setLoading(false);
  }, [user]);

  // Load accounts when auth is ready and user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchAccounts();
    } else if (!authLoading && !user) {
      setLoading(false);
      setAccounts([]);
    }
  }, [authLoading, user, fetchAccounts]);

  // Add a new account
  const addAccount = useCallback(
    async (name: string, type: AccountType, initialBalance: number) => {
      const response = await createAccount({
        name,
        type,
        initial_balance: initialBalance,
      });

      if (response.success && response.data) {
        // Optimistic update
        setAccounts((prev) => [...prev, response.data!]);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  // Edit an existing account
  const editAccount = useCallback(
    async (
      id: string,
      updates: { name?: string; type?: AccountType; initial_balance?: number }
    ) => {
      const response = await updateAccount(id, updates);

      if (response.success && response.data) {
        // Optimistic update
        setAccounts((prev) => prev.map((acc) => (acc.id === id ? response.data! : acc)));
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  // Remove an account (soft delete)
  const removeAccount = useCallback(async (id: string) => {
    const response = await deleteAccount(id);

    if (response.success) {
      // Optimistic update
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts,
    addAccount,
    editAccount,
    removeAccount,
  };
}
