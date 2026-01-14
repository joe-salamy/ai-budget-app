// Scoring service - Financial Health Score calculations
import { supabase } from "../lib/supabaseClient";
import { calculateNetWorth, getDashboardMetrics } from "./dashboard";
import type { GoalPeriod } from "../types";

// ============== TYPES ==============

export interface ScoreBreakdown {
  spendingVsGoals: {
    score: number;
    maxScore: 40;
    details: string;
    goalsCount: number;
    avgPerformance: number; // percentage (0-100+)
  };
  savingsRate: {
    score: number;
    maxScore: 30;
    details: string;
    rate: number; // percentage
  };
  savingGoalsProgress: {
    score: number;
    maxScore: 20;
    details: string;
    goalsCount: number;
    avgProgress: number; // percentage
  };
  netWorthTrend: {
    score: number;
    maxScore: 10;
    details: string;
    changePercent: number;
    changeAmount: number;
  };
}

export interface HealthScoreResult {
  totalScore: number;
  maxScore: 100;
  breakdown: ScoreBreakdown;
  tips: string[];
}

export interface HealthScoreResponse {
  success: boolean;
  data?: HealthScoreResult;
  error?: string;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface ScoreHistoryResponse {
  success: boolean;
  data?: ScoreHistoryPoint[];
  error?: string;
}

// Period to days conversion
const PERIOD_TO_DAYS: Record<GoalPeriod, number> = {
  weekly: 7,
  monthly: 30.44,
  quarterly: 91.31,
  annual: 365.25,
};

// ============== MAIN SCORING FUNCTION ==============

/**
 * Calculate the Financial Health Score for a user within a date range
 * Score is 0-100 based on four factors
 */
export async function calculateFinancialHealthScore(
  startDate: string,
  endDate: string
): Promise<HealthScoreResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Calculate all score components in parallel
    const [spendingResult, savingsRateResult, savingGoalsResult, netWorthResult] =
      await Promise.all([
        calculateSpendingVsGoals(user.id, startDate, endDate),
        calculateSavingsRate(user.id, startDate, endDate),
        calculateSavingGoalsProgress(user.id),
        calculateNetWorthTrend(user.id, startDate, endDate),
      ]);

    // Build breakdown
    const breakdown: ScoreBreakdown = {
      spendingVsGoals: spendingResult,
      savingsRate: savingsRateResult,
      savingGoalsProgress: savingGoalsResult,
      netWorthTrend: netWorthResult,
    };

    // Calculate total score
    const totalScore =
      breakdown.spendingVsGoals.score +
      breakdown.savingsRate.score +
      breakdown.savingGoalsProgress.score +
      breakdown.netWorthTrend.score;

    // Generate tips based on lowest scoring areas
    const tips = generateTips(breakdown);

    return {
      success: true,
      data: {
        totalScore: Math.round(totalScore),
        maxScore: 100,
        breakdown,
        tips,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== SCORE COMPONENT CALCULATIONS ==============

/**
 * Calculate Spending vs Goals score (40 points max)
 */
async function calculateSpendingVsGoals(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ScoreBreakdown["spendingVsGoals"]> {
  // Get spending goals
  const { data: goals, error: goalsError } = await supabase
    .from("spending_goals")
    .select("id, subcategory_id, amount, period")
    .eq("user_id", userId);

  if (goalsError || !goals || goals.length === 0) {
    // No goals set - give neutral score
    return {
      score: 20,
      maxScore: 40,
      details: "No spending goals set",
      goalsCount: 0,
      avgPerformance: 50,
    };
  }

  // Calculate the number of days in the date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rangeInDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  // Get transactions for spending goals in the date range
  const subcategoryIds = goals.map((g) => g.subcategory_id);
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, subcategory_id")
    .eq("user_id", userId)
    .in("subcategory_id", subcategoryIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .is("deleted_at", null);

  // Calculate spending by subcategory
  const spendingBySubcategory: Record<string, number> = {};
  (transactions || []).forEach((txn) => {
    if (txn.subcategory_id) {
      spendingBySubcategory[txn.subcategory_id] =
        (spendingBySubcategory[txn.subcategory_id] || 0) + Math.abs(txn.amount);
    }
  });

  // Calculate performance for each goal
  let totalPerformance = 0;
  let goalsWithSpending = 0;

  goals.forEach((goal) => {
    // Scale goal amount to match the date range
    const goalPeriodDays = PERIOD_TO_DAYS[goal.period as GoalPeriod] || 30.44;
    const scaledGoal = (goal.amount / goalPeriodDays) * rangeInDays;
    const spent = spendingBySubcategory[goal.subcategory_id] || 0;

    if (scaledGoal > 0) {
      // Performance: 100% means exactly at budget, >100% means under budget
      const performance = ((scaledGoal - spent) / scaledGoal) * 100 + 100;
      totalPerformance += Math.min(200, Math.max(0, performance));
      goalsWithSpending++;
    }
  });

  // Calculate average performance (0-200 scale, 100 = exactly on budget)
  const avgPerformance = goalsWithSpending > 0 ? totalPerformance / goalsWithSpending : 100;

  // Convert to score (0-40)
  // avgPerformance of 100 = on budget = 20 points
  // avgPerformance of 200 (way under budget) = 40 points
  // avgPerformance of 0 (way over budget) = 0 points
  const score = Math.min(40, Math.max(0, (avgPerformance / 200) * 40));

  let details = "";
  if (avgPerformance >= 150) {
    details = "Excellent! Well under budget";
  } else if (avgPerformance >= 100) {
    details = "Good! At or under budget";
  } else if (avgPerformance >= 75) {
    details = "Slightly over budget";
  } else {
    details = "Significantly over budget";
  }

  return {
    score: Math.round(score),
    maxScore: 40,
    details,
    goalsCount: goals.length,
    avgPerformance: Math.round(avgPerformance - 100), // -100 to 100 scale for display
  };
}

/**
 * Calculate Savings Rate score (30 points max)
 */
async function calculateSavingsRate(
  _userId: string,
  startDate: string,
  endDate: string
): Promise<ScoreBreakdown["savingsRate"]> {
  // Get income and expenses for the period
  const metricsResult = await getDashboardMetrics(startDate, endDate);

  if (!metricsResult.success || !metricsResult.data) {
    return {
      score: 15, // Neutral
      maxScore: 30,
      details: "Unable to calculate",
      rate: 0,
    };
  }

  const { totalIncome, totalExpenses } = metricsResult.data;

  // Calculate savings rate
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
  }

  // Convert to score based on thresholds
  let score: number;
  let details: string;

  if (savingsRate < 0) {
    score = 0;
    details = "Spending exceeds income";
  } else if (savingsRate < 10) {
    score = (savingsRate / 10) * 10; // 0-10 points for 0-10% savings
    details = `${savingsRate.toFixed(1)}% savings rate`;
  } else if (savingsRate < 20) {
    score = 10 + ((savingsRate - 10) / 10) * 10; // 10-20 points for 10-20%
    details = `${savingsRate.toFixed(1)}% savings rate`;
  } else {
    score = 20 + Math.min(10, ((savingsRate - 20) / 10) * 10); // 20-30 points for >20%
    details = `Excellent ${savingsRate.toFixed(1)}% savings rate`;
  }

  return {
    score: Math.round(score),
    maxScore: 30,
    details,
    rate: savingsRate,
  };
}

/**
 * Calculate Saving Goals Progress score (20 points max)
 */
async function calculateSavingGoalsProgress(
  userId: string
): Promise<ScoreBreakdown["savingGoalsProgress"]> {
  // Get saving goals (not completed)
  const { data: goals, error: goalsError } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("user_id", userId)
    .is("completed_at", null);

  if (goalsError || !goals || goals.length === 0) {
    // No active saving goals - give neutral score
    return {
      score: 10,
      maxScore: 20,
      details: "No active saving goals",
      goalsCount: 0,
      avgProgress: 50,
    };
  }

  // Calculate progress for each goal
  let totalProgress = 0;
  let goalsWithTarget = 0;

  goals.forEach((goal) => {
    if (goal.target_amount && goal.target_amount > 0) {
      const progress = Math.min(100, ((goal.current_amount || 0) / goal.target_amount) * 100);
      totalProgress += progress;
      goalsWithTarget++;
    }
  });

  // Calculate average progress
  const avgProgress = goalsWithTarget > 0 ? totalProgress / goalsWithTarget : 0;

  // Convert to score (0-20)
  const score = (avgProgress / 100) * 20;

  let details = "";
  if (avgProgress >= 75) {
    details = "Great progress on saving goals!";
  } else if (avgProgress >= 50) {
    details = "Good progress on saving goals";
  } else if (avgProgress >= 25) {
    details = "Making progress on saving goals";
  } else {
    details = "Just getting started on saving goals";
  }

  return {
    score: Math.round(score),
    maxScore: 20,
    details,
    goalsCount: goals.length,
    avgProgress: Math.round(avgProgress),
  };
}

/**
 * Calculate Net Worth Trend score (10 points max)
 */
async function calculateNetWorthTrend(
  _userId: string,
  startDate: string,
  endDate: string
): Promise<ScoreBreakdown["netWorthTrend"]> {
  // Calculate net worth at start and end of period
  const [startResult, endResult] = await Promise.all([
    calculateNetWorth(startDate),
    calculateNetWorth(endDate),
  ]);

  if (!startResult.success || !endResult.success || !startResult.data || !endResult.data) {
    return {
      score: 5, // Neutral
      maxScore: 10,
      details: "Unable to calculate trend",
      changePercent: 0,
      changeAmount: 0,
    };
  }

  const startNetWorth = startResult.data.net_worth;
  const endNetWorth = endResult.data.net_worth;
  const changeAmount = endNetWorth - startNetWorth;

  // Calculate percentage change
  let changePercent = 0;
  if (startNetWorth !== 0) {
    changePercent = (changeAmount / Math.abs(startNetWorth)) * 100;
  } else if (changeAmount > 0) {
    changePercent = 100; // Went from 0 to positive
  } else if (changeAmount < 0) {
    changePercent = -100; // Went from 0 to negative
  }

  // Convert to score
  let score: number;
  let details: string;

  if (changeAmount > 0) {
    score = 10;
    details = `Net worth increased by ${Math.abs(changePercent).toFixed(1)}%`;
  } else if (changeAmount === 0) {
    score = 5;
    details = "Net worth unchanged";
  } else {
    // Negative change - scale from 0-5 based on how bad the decline is
    // Up to -20% decline = 5 points, worse than -20% = 0 points
    score = Math.max(0, 5 - Math.min(5, (Math.abs(changePercent) / 20) * 5));
    details = `Net worth decreased by ${Math.abs(changePercent).toFixed(1)}%`;
  }

  return {
    score: Math.round(score),
    maxScore: 10,
    details,
    changePercent,
    changeAmount,
  };
}

// ============== TIPS GENERATION ==============

function generateTips(breakdown: ScoreBreakdown): string[] {
  const tips: string[] = [];

  // Spending tips
  if (breakdown.spendingVsGoals.score < 20) {
    if (breakdown.spendingVsGoals.goalsCount === 0) {
      tips.push("Set spending goals to help track and control your expenses");
    } else {
      tips.push("Review your spending categories to identify areas to cut back");
    }
  }

  // Savings rate tips
  if (breakdown.savingsRate.score < 15) {
    if (breakdown.savingsRate.rate < 0) {
      tips.push("Focus on reducing expenses to stop spending more than you earn");
    } else if (breakdown.savingsRate.rate < 10) {
      tips.push("Aim to save at least 10% of your income each month");
    } else {
      tips.push("Great job! Try to push your savings rate above 20%");
    }
  }

  // Saving goals tips
  if (breakdown.savingGoalsProgress.score < 10) {
    if (breakdown.savingGoalsProgress.goalsCount === 0) {
      tips.push("Create saving goals to work toward specific financial targets");
    } else {
      tips.push("Consider setting up automatic transfers to boost your saving goals");
    }
  }

  // Net worth tips
  if (breakdown.netWorthTrend.score < 5) {
    tips.push("Focus on increasing assets or paying down debts to grow your net worth");
  }

  // If doing well, add encouragement
  if (tips.length === 0) {
    tips.push("Keep up the excellent work! Your financial health is strong");
  }

  return tips.slice(0, 3); // Limit to 3 tips
}

// ============== SCORE HISTORY ==============

/**
 * Get historical financial health scores for the past N months
 * Calculates score for each month independently
 */
export async function getScoreHistory(months: number = 6): Promise<ScoreHistoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const history: ScoreHistoryPoint[] = [];
    const now = new Date();

    // Calculate score for each of the past N months
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const startDate = monthStart.toISOString().split("T")[0];
      const endDate = monthEnd.toISOString().split("T")[0];

      const result = await calculateFinancialHealthScore(startDate, endDate);

      if (result.success && result.data) {
        history.push({
          date: startDate,
          score: result.data.totalScore,
        });
      }
    }

    return { success: true, data: history };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get score breakdown details for a specific date range
 */
export async function getScoreBreakdown(
  startDate: string,
  endDate: string
): Promise<HealthScoreResponse> {
  return calculateFinancialHealthScore(startDate, endDate);
}
