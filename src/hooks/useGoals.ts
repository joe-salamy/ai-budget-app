// useGoals hook - Fetch and manage spending and saving goals
import { useState, useEffect, useCallback } from "react";
import {
  getSpendingGoalsWithDetails,
  createSpendingGoal,
  updateSpendingGoal,
  deleteSpendingGoal,
  getSpendingProgress,
  getSavingGoalsWithDetails,
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
  completeSavingGoal,
  uncompleteSavingGoal,
  addToSavingGoal,
  getSavingProgress,
} from "../services/goals";
import type {
  SpendingGoalWithDetails,
  SavingGoalWithDetails,
  CreateSpendingGoalData,
  UpdateSpendingGoalData,
  CreateSavingGoalData,
  UpdateSavingGoalData,
} from "../services/goals";
import type { SpendingGoal, SavingGoal, GoalPeriod } from "../types";
import { useAuth } from "./useAuth";

// ============== TYPES ==============

export interface SpendingGoalProgress {
  goal: SpendingGoal;
  spent: number;
  remaining: number;
  percentUsed: number;
  periodStart: string;
  periodEnd: string;
}

export interface SavingGoalProgress {
  goal: SavingGoal;
  percentComplete: number;
  amountRemaining: number;
  daysRemaining: number | null;
  estimatedCompletionDate: string | null;
  onTrack: boolean | null;
}

interface UseGoalsReturn {
  // Spending goals
  spendingGoals: SpendingGoalWithDetails[];
  spendingGoalsLoading: boolean;
  spendingGoalsError: string | null;
  refreshSpendingGoals: () => Promise<void>;
  addSpendingGoal: (
    subcategoryId: string,
    amount: number,
    period: GoalPeriod,
    startDate: string,
    endDate?: string | null
  ) => Promise<{ success: boolean; error?: string; data?: SpendingGoal }>;
  editSpendingGoal: (
    id: string,
    updates: UpdateSpendingGoalData
  ) => Promise<{ success: boolean; error?: string; data?: SpendingGoal }>;
  removeSpendingGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  getSpendingGoalProgress: (
    goalId: string,
    referenceDate?: string
  ) => Promise<{ success: boolean; error?: string; data?: SpendingGoalProgress }>;

  // Saving goals
  savingGoals: SavingGoalWithDetails[];
  savingGoalsLoading: boolean;
  savingGoalsError: string | null;
  refreshSavingGoals: () => Promise<void>;
  addSavingGoal: (
    name: string,
    options?: {
      targetAmount?: number | null;
      targetDate?: string | null;
      currentAmount?: number;
      accountId?: string | null;
    }
  ) => Promise<{ success: boolean; error?: string; data?: SavingGoal }>;
  editSavingGoal: (
    id: string,
    updates: UpdateSavingGoalData
  ) => Promise<{ success: boolean; error?: string; data?: SavingGoal }>;
  removeSavingGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  markSavingGoalComplete: (id: string) => Promise<{ success: boolean; error?: string }>;
  markSavingGoalIncomplete: (id: string) => Promise<{ success: boolean; error?: string }>;
  addAmountToSavingGoal: (
    id: string,
    amount: number
  ) => Promise<{ success: boolean; error?: string; data?: SavingGoal }>;
  getSavingGoalProgress: (
    goalId: string
  ) => Promise<{ success: boolean; error?: string; data?: SavingGoalProgress }>;

  // Combined
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing spending and saving goals
 */
export function useGoals(): UseGoalsReturn {
  const { user, loading: authLoading } = useAuth();

  // Spending goals state
  const [spendingGoals, setSpendingGoals] = useState<SpendingGoalWithDetails[]>([]);
  const [spendingGoalsLoading, setSpendingGoalsLoading] = useState<boolean>(true);
  const [spendingGoalsError, setSpendingGoalsError] = useState<string | null>(null);

  // Saving goals state
  const [savingGoals, setSavingGoals] = useState<SavingGoalWithDetails[]>([]);
  const [savingGoalsLoading, setSavingGoalsLoading] = useState<boolean>(true);
  const [savingGoalsError, setSavingGoalsError] = useState<string | null>(null);

  // ============== FETCH FUNCTIONS ==============

  const fetchSpendingGoals = useCallback(async () => {
    if (!user) {
      setSpendingGoalsLoading(false);
      return;
    }

    setSpendingGoalsLoading(true);
    setSpendingGoalsError(null);

    const response = await getSpendingGoalsWithDetails();

    if (response.success && response.data) {
      setSpendingGoals(response.data);
    } else {
      setSpendingGoalsError(response.error || "Failed to fetch spending goals");
    }

    setSpendingGoalsLoading(false);
  }, [user]);

  const fetchSavingGoals = useCallback(async () => {
    if (!user) {
      setSavingGoalsLoading(false);
      return;
    }

    setSavingGoalsLoading(true);
    setSavingGoalsError(null);

    const response = await getSavingGoalsWithDetails();

    if (response.success && response.data) {
      setSavingGoals(response.data);
    } else {
      setSavingGoalsError(response.error || "Failed to fetch saving goals");
    }

    setSavingGoalsLoading(false);
  }, [user]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchSpendingGoals(), fetchSavingGoals()]);
  }, [fetchSpendingGoals, fetchSavingGoals]);

  // Load data when auth is ready
  useEffect(() => {
    if (!authLoading && user) {
      fetchAll();
    } else if (!authLoading && !user) {
      setSpendingGoalsLoading(false);
      setSavingGoalsLoading(false);
      setSpendingGoals([]);
      setSavingGoals([]);
    }
  }, [authLoading, user, fetchAll]);

  // ============== SPENDING GOAL OPERATIONS ==============

  const addSpendingGoal = useCallback(
    async (
      subcategoryId: string,
      amount: number,
      period: GoalPeriod,
      startDate: string,
      endDate?: string | null
    ) => {
      const data: CreateSpendingGoalData = {
        subcategory_id: subcategoryId,
        amount,
        period,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await createSpendingGoal(data);

      if (response.success && response.data) {
        // Refresh to get the full details
        await fetchSpendingGoals();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSpendingGoals]
  );

  const editSpendingGoal = useCallback(
    async (id: string, updates: UpdateSpendingGoalData) => {
      const response = await updateSpendingGoal(id, updates);

      if (response.success && response.data) {
        // Refresh to get updated details
        await fetchSpendingGoals();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSpendingGoals]
  );

  const removeSpendingGoal = useCallback(async (id: string) => {
    const response = await deleteSpendingGoal(id);

    if (response.success) {
      setSpendingGoals((prev) => prev.filter((g) => g.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const getSpendingGoalProgressFn = useCallback(async (goalId: string, referenceDate?: string) => {
    const response = await getSpendingProgress(goalId, referenceDate);

    if (response.success && response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  // ============== SAVING GOAL OPERATIONS ==============

  const addSavingGoal = useCallback(
    async (
      name: string,
      options?: {
        targetAmount?: number | null;
        targetDate?: string | null;
        currentAmount?: number;
        accountId?: string | null;
      }
    ) => {
      const data: CreateSavingGoalData = {
        name,
        target_amount: options?.targetAmount,
        target_date: options?.targetDate,
        current_amount: options?.currentAmount,
        account_id: options?.accountId,
      };

      const response = await createSavingGoal(data);

      if (response.success && response.data) {
        // Refresh to get full details
        await fetchSavingGoals();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSavingGoals]
  );

  const editSavingGoal = useCallback(
    async (id: string, updates: UpdateSavingGoalData) => {
      const response = await updateSavingGoal(id, updates);

      if (response.success && response.data) {
        // Refresh to get updated details
        await fetchSavingGoals();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSavingGoals]
  );

  const removeSavingGoal = useCallback(async (id: string) => {
    const response = await deleteSavingGoal(id);

    if (response.success) {
      setSavingGoals((prev) => prev.filter((g) => g.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const markSavingGoalComplete = useCallback(
    async (id: string) => {
      const response = await completeSavingGoal(id);

      if (response.success) {
        await fetchSavingGoals();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSavingGoals]
  );

  const markSavingGoalIncomplete = useCallback(
    async (id: string) => {
      const response = await uncompleteSavingGoal(id);

      if (response.success) {
        await fetchSavingGoals();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSavingGoals]
  );

  const addAmountToSavingGoal = useCallback(
    async (id: string, amount: number) => {
      const response = await addToSavingGoal(id, amount);

      if (response.success && response.data) {
        await fetchSavingGoals();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    [fetchSavingGoals]
  );

  const getSavingGoalProgressFn = useCallback(async (goalId: string) => {
    const response = await getSavingProgress(goalId);

    if (response.success && response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  // ============== RETURN ==============

  return {
    // Spending goals
    spendingGoals,
    spendingGoalsLoading,
    spendingGoalsError,
    refreshSpendingGoals: fetchSpendingGoals,
    addSpendingGoal,
    editSpendingGoal,
    removeSpendingGoal,
    getSpendingGoalProgress: getSpendingGoalProgressFn,

    // Saving goals
    savingGoals,
    savingGoalsLoading,
    savingGoalsError,
    refreshSavingGoals: fetchSavingGoals,
    addSavingGoal,
    editSavingGoal,
    removeSavingGoal,
    markSavingGoalComplete,
    markSavingGoalIncomplete,
    addAmountToSavingGoal,
    getSavingGoalProgress: getSavingGoalProgressFn,

    // Combined
    loading: spendingGoalsLoading || savingGoalsLoading,
    error: spendingGoalsError || savingGoalsError,
    refresh: fetchAll,
  };
}
