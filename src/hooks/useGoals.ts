// useGoals hook - Fetch and manage spending and saving goals
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { queryKeys } from "../lib/queryKeys";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Spending goals query
  const {
    data: spendingGoals = [],
    isLoading: spendingGoalsLoading,
    error: spendingGoalsQueryError,
    refetch: refetchSpendingGoals,
  } = useQuery({
    queryKey: queryKeys.goals.spending.list(),
    queryFn: async () => {
      const response = await getSpendingGoalsWithDetails();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch spending goals");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // Saving goals query
  const {
    data: savingGoals = [],
    isLoading: savingGoalsLoading,
    error: savingGoalsQueryError,
    refetch: refetchSavingGoals,
  } = useQuery({
    queryKey: queryKeys.goals.saving.list(),
    queryFn: async () => {
      const response = await getSavingGoalsWithDetails();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch saving goals");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // ============== SPENDING GOAL MUTATIONS ==============

  const addSpendingGoalMutation = useMutation({
    mutationFn: async (data: CreateSpendingGoalData) => {
      return await createSpendingGoal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.spending.all });
    },
  });

  const updateSpendingGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSpendingGoalData }) => {
      return await updateSpendingGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.spending.all });
    },
  });

  const deleteSpendingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSpendingGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.spending.all });
    },
  });

  // ============== SAVING GOAL MUTATIONS ==============

  const addSavingGoalMutation = useMutation({
    mutationFn: async (data: CreateSavingGoalData) => {
      return await createSavingGoal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  const updateSavingGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSavingGoalData }) => {
      return await updateSavingGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  const deleteSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSavingGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  const completeSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await completeSavingGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  const uncompleteSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await uncompleteSavingGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  const addToSavingGoalMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return await addToSavingGoal(id, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.saving.all });
    },
  });

  // ============== WRAPPER FUNCTIONS ==============

  const addSpendingGoal = async (
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
    const result = await addSpendingGoalMutation.mutateAsync(data);
    return result;
  };

  const editSpendingGoal = async (id: string, updates: UpdateSpendingGoalData) => {
    const result = await updateSpendingGoalMutation.mutateAsync({ id, updates });
    return result;
  };

  const removeSpendingGoal = async (id: string) => {
    const result = await deleteSpendingGoalMutation.mutateAsync(id);
    return result;
  };

  const getSpendingGoalProgress = async (goalId: string, referenceDate?: string) => {
    const response = await getSpendingProgress(goalId, referenceDate);
    if (response.success && response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  };

  const addSavingGoal = async (
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
    const result = await addSavingGoalMutation.mutateAsync(data);
    return result;
  };

  const editSavingGoal = async (id: string, updates: UpdateSavingGoalData) => {
    const result = await updateSavingGoalMutation.mutateAsync({ id, updates });
    return result;
  };

  const removeSavingGoal = async (id: string) => {
    const result = await deleteSavingGoalMutation.mutateAsync(id);
    return result;
  };

  const markSavingGoalComplete = async (id: string) => {
    const result = await completeSavingGoalMutation.mutateAsync(id);
    return result;
  };

  const markSavingGoalIncomplete = async (id: string) => {
    const result = await uncompleteSavingGoalMutation.mutateAsync(id);
    return result;
  };

  const addAmountToSavingGoal = async (id: string, amount: number) => {
    const result = await addToSavingGoalMutation.mutateAsync({ id, amount });
    return result;
  };

  const getSavingGoalProgress = async (goalId: string) => {
    const response = await getSavingProgress(goalId);
    if (response.success && response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  };

  const refreshSpendingGoals = async () => {
    await refetchSpendingGoals();
  };

  const refreshSavingGoals = async () => {
    await refetchSavingGoals();
  };

  const refresh = async () => {
    await Promise.all([refetchSpendingGoals(), refetchSavingGoals()]);
  };

  // ============== RETURN ==============

  const spendingGoalsError = spendingGoalsQueryError?.message || null;
  const savingGoalsError = savingGoalsQueryError?.message || null;

  return {
    // Spending goals
    spendingGoals,
    spendingGoalsLoading,
    spendingGoalsError,
    refreshSpendingGoals,
    addSpendingGoal,
    editSpendingGoal,
    removeSpendingGoal,
    getSpendingGoalProgress,

    // Saving goals
    savingGoals,
    savingGoalsLoading,
    savingGoalsError,
    refreshSavingGoals,
    addSavingGoal,
    editSavingGoal,
    removeSavingGoal,
    markSavingGoalComplete,
    markSavingGoalIncomplete,
    addAmountToSavingGoal,
    getSavingGoalProgress,

    // Combined
    loading: spendingGoalsLoading || savingGoalsLoading,
    error: spendingGoalsError || savingGoalsError,
    refresh,
  };
}
