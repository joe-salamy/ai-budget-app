// Goals service - CRUD operations for spending and saving goals
import { supabase } from "../lib/supabaseClient";
import type { SpendingGoal, SavingGoal, GoalPeriod } from "../types";

// ============== TYPES ==============

export interface CreateSpendingGoalData {
  subcategory_id: string;
  amount: number;
  period: GoalPeriod;
  start_date: string;
  end_date?: string | null;
}

export interface UpdateSpendingGoalData {
  amount?: number;
  period?: GoalPeriod;
  start_date?: string;
  end_date?: string | null;
}

export interface SpendingGoalResponse {
  success: boolean;
  data?: SpendingGoal;
  error?: string;
}

export interface SpendingGoalsResponse {
  success: boolean;
  data?: SpendingGoal[];
  error?: string;
}

export interface CreateSavingGoalData {
  name: string;
  target_amount?: number | null;
  target_date?: string | null;
  current_amount?: number;
  account_id?: string | null;
}

export interface UpdateSavingGoalData {
  name?: string;
  target_amount?: number | null;
  target_date?: string | null;
  current_amount?: number;
  account_id?: string | null;
  completed_at?: string | null;
}

export interface SavingGoalResponse {
  success: boolean;
  data?: SavingGoal;
  error?: string;
}

export interface SavingGoalsResponse {
  success: boolean;
  data?: SavingGoal[];
  error?: string;
}

// Extended types with related data
export interface SpendingGoalWithDetails extends SpendingGoal {
  subcategory_name: string;
  category_name: string;
  category_type: "income" | "expense";
}

export interface SavingGoalWithDetails extends SavingGoal {
  account_name: string | null;
}

export interface SpendingGoalsWithDetailsResponse {
  success: boolean;
  data?: SpendingGoalWithDetails[];
  error?: string;
}

export interface SavingGoalsWithDetailsResponse {
  success: boolean;
  data?: SavingGoalWithDetails[];
  error?: string;
}

// ============== SPENDING GOALS ==============

/**
 * Create a new spending goal
 */
export async function createSpendingGoal(
  goalData: CreateSpendingGoalData
): Promise<SpendingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if a goal already exists for this subcategory
    const { data: existingGoal } = await supabase
      .from("spending_goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("subcategory_id", goalData.subcategory_id)
      .single();

    if (existingGoal) {
      return {
        success: false,
        error: "A spending goal already exists for this subcategory",
      };
    }

    const { data, error } = await supabase
      .from("spending_goals")
      .insert({
        user_id: user.id,
        subcategory_id: goalData.subcategory_id,
        amount: goalData.amount,
        period: goalData.period,
        start_date: goalData.start_date,
        end_date: goalData.end_date || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all spending goals for the current user
 */
export async function getSpendingGoals(): Promise<SpendingGoalsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("spending_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all spending goals with subcategory and category details
 */
export async function getSpendingGoalsWithDetails(): Promise<SpendingGoalsWithDetailsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("spending_goals")
      .select(
        `
        *,
        subcategories!inner (
          name,
          categories!inner (
            name,
            type
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform the data to flatten the nested objects
    const goalsWithDetails: SpendingGoalWithDetails[] = (data || []).map((goal) => {
      const subcategory = goal.subcategories as unknown as {
        name: string;
        categories: { name: string; type: "income" | "expense" };
      };

      return {
        id: goal.id,
        user_id: goal.user_id,
        subcategory_id: goal.subcategory_id,
        amount: goal.amount,
        period: goal.period,
        start_date: goal.start_date,
        end_date: goal.end_date,
        created_at: goal.created_at,
        updated_at: goal.updated_at,
        subcategory_name: subcategory.name,
        category_name: subcategory.categories.name,
        category_type: subcategory.categories.type,
      };
    });

    return { success: true, data: goalsWithDetails };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a single spending goal by ID
 */
export async function getSpendingGoalById(id: string): Promise<SpendingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("spending_goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update a spending goal
 */
export async function updateSpendingGoal(
  id: string,
  updates: UpdateSpendingGoalData
): Promise<SpendingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("spending_goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete a spending goal
 */
export async function deleteSpendingGoal(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("spending_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get spending progress for a goal within a date range
 * Returns total spent in the period matching the goal's period
 */
export async function getSpendingProgress(
  goalId: string,
  referenceDate?: string
): Promise<{
  success: boolean;
  data?: {
    goal: SpendingGoal;
    spent: number;
    remaining: number;
    percentUsed: number;
    periodStart: string;
    periodEnd: string;
  };
  error?: string;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the goal
    const { data: goal, error: goalError } = await supabase
      .from("spending_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (goalError || !goal) {
      return { success: false, error: goalError?.message || "Goal not found" };
    }

    // Calculate the period boundaries based on goal period
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (goal.period) {
      case "weekly": {
        // Get the start of the current week (Sunday)
        const day = ref.getDay();
        periodStart = new Date(ref);
        periodStart.setDate(ref.getDate() - day);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        break;
      }
      case "monthly": {
        periodStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
        periodEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        break;
      }
      case "quarterly": {
        const quarter = Math.floor(ref.getMonth() / 3);
        periodStart = new Date(ref.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(ref.getFullYear(), (quarter + 1) * 3, 0);
        break;
      }
      case "annual": {
        periodStart = new Date(ref.getFullYear(), 0, 1);
        periodEnd = new Date(ref.getFullYear(), 11, 31);
        break;
      }
      default:
        periodStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
        periodEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    }

    // Get transactions for this subcategory in the period
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("subcategory_id", goal.subcategory_id)
      .gte("date", periodStart.toISOString().split("T")[0])
      .lte("date", periodEnd.toISOString().split("T")[0])
      .is("deleted_at", null);

    if (txError) {
      return { success: false, error: txError.message };
    }

    // Calculate spent amount (absolute value since expenses are negative)
    const spent = Math.abs((transactions || []).reduce((sum, t) => sum + t.amount, 0));
    const remaining = Math.max(0, goal.amount - spent);
    const percentUsed = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;

    return {
      success: true,
      data: {
        goal,
        spent,
        remaining,
        percentUsed,
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== SAVING GOALS ==============

/**
 * Create a new saving goal
 */
export async function createSavingGoal(
  goalData: CreateSavingGoalData
): Promise<SavingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // At least one of target_amount or target_date must be provided
    if (!goalData.target_amount && !goalData.target_date) {
      return {
        success: false,
        error: "Either target amount or target date must be specified",
      };
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .insert({
        user_id: user.id,
        name: goalData.name,
        target_amount: goalData.target_amount || null,
        target_date: goalData.target_date || null,
        current_amount: goalData.current_amount || 0,
        account_id: goalData.account_id || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all saving goals for the current user
 */
export async function getSavingGoals(): Promise<SavingGoalsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all saving goals with account details
 */
export async function getSavingGoalsWithDetails(): Promise<SavingGoalsWithDetailsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .select(
        `
        *,
        accounts (name)
      `
      )
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform to flatten account name
    const goalsWithDetails: SavingGoalWithDetails[] = (data || []).map((goal) => {
      const account = goal.accounts as unknown as { name: string } | null;
      return {
        id: goal.id,
        user_id: goal.user_id,
        name: goal.name,
        target_amount: goal.target_amount,
        target_date: goal.target_date,
        current_amount: goal.current_amount,
        account_id: goal.account_id,
        created_at: goal.created_at,
        updated_at: goal.updated_at,
        completed_at: goal.completed_at,
        account_name: account?.name || null,
      };
    });

    return { success: true, data: goalsWithDetails };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a single saving goal by ID
 */
export async function getSavingGoalById(id: string): Promise<SavingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update a saving goal
 */
export async function updateSavingGoal(
  id: string,
  updates: UpdateSavingGoalData
): Promise<SavingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete a saving goal
 */
export async function deleteSavingGoal(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("saving_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Mark a saving goal as completed
 */
export async function completeSavingGoal(id: string): Promise<SavingGoalResponse> {
  return updateSavingGoal(id, { completed_at: new Date().toISOString() });
}

/**
 * Unmark a saving goal as completed
 */
export async function uncompleteSavingGoal(id: string): Promise<SavingGoalResponse> {
  return updateSavingGoal(id, { completed_at: null });
}

/**
 * Add to current amount of a saving goal
 */
export async function addToSavingGoal(id: string, amount: number): Promise<SavingGoalResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get current amount first
    const { data: goal, error: getError } = await supabase
      .from("saving_goals")
      .select("current_amount, target_amount")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (getError || !goal) {
      return { success: false, error: getError?.message || "Goal not found" };
    }

    const newAmount = (goal.current_amount || 0) + amount;
    const updates: UpdateSavingGoalData = { current_amount: newAmount };

    // Auto-complete if target is reached
    if (goal.target_amount && newAmount >= goal.target_amount) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("saving_goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get saving goal progress including estimated completion
 */
export async function getSavingProgress(goalId: string): Promise<{
  success: boolean;
  data?: {
    goal: SavingGoal;
    percentComplete: number;
    amountRemaining: number;
    daysRemaining: number | null;
    estimatedCompletionDate: string | null;
    onTrack: boolean | null;
  };
  error?: string;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the goal
    const { data: goal, error: goalError } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (goalError || !goal) {
      return { success: false, error: goalError?.message || "Goal not found" };
    }

    // Calculate progress
    const currentAmount = goal.current_amount || 0;
    const targetAmount = goal.target_amount || 0;
    const percentComplete = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const amountRemaining = Math.max(0, targetAmount - currentAmount);

    // Calculate days remaining and on-track status
    let daysRemaining: number | null = null;
    let estimatedCompletionDate: string | null = null;
    let onTrack: boolean | null = null;

    if (goal.target_date) {
      const targetDate = new Date(goal.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate if on track based on time elapsed
      const createdDate = new Date(goal.created_at);
      createdDate.setHours(0, 0, 0, 0);
      const totalDays = Math.ceil(
        (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const elapsedDays = Math.ceil(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
      onTrack = percentComplete >= expectedProgress;
    }

    // Estimate completion date based on average savings rate
    if (targetAmount > 0 && currentAmount > 0 && !goal.completed_at) {
      const createdDate = new Date(goal.created_at);
      const today = new Date();
      const daysSinceCreation = Math.max(
        1,
        Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const dailyRate = currentAmount / daysSinceCreation;

      if (dailyRate > 0) {
        const daysToComplete = Math.ceil(amountRemaining / dailyRate);
        const estimated = new Date(today);
        estimated.setDate(estimated.getDate() + daysToComplete);
        estimatedCompletionDate = estimated.toISOString().split("T")[0];
      }
    }

    return {
      success: true,
      data: {
        goal,
        percentComplete,
        amountRemaining,
        daysRemaining,
        estimatedCompletionDate,
        onTrack,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
