// Goals service - CRUD operations for spending goals
import { supabase } from "../lib/supabaseClient";
import type { SpendingGoal, GoalPeriod } from "../types";

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

// Extended types with related data
export interface SpendingGoalWithDetails extends SpendingGoal {
  subcategory_name: string;
  category_name: string;
  category_type: "income" | "expense";
}

export interface SpendingGoalsWithDetailsResponse {
  success: boolean;
  data?: SpendingGoalWithDetails[];
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
      .is("deleted_at", null)
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
        deleted_at: goal.deleted_at,
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
 * Delete a spending goal (soft delete)
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
      .update({ deleted_at: new Date().toISOString() })
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
