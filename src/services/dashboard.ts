// Dashboard service - Summary calculations for the dashboard
import { supabase } from "../lib/supabaseClient";
import type { AccountType, CategoryType } from "../types";

// ============== TYPES ==============

export interface AccountSummary {
  account_id: string;
  account_name: string;
  account_type: AccountType;
  starting_balance: number;
  total_change: number;
  ending_balance: number;
  transactions: AccountTransaction[];
}

export interface AccountTransaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  running_balance: number;
  subcategory_name: string | null;
  category_name: string | null;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_type: CategoryType;
  total: number;
  goal: number | null;
  difference: number | null;
  subcategories: SubcategorySummary[];
}

export interface SubcategorySummary {
  subcategory_id: string;
  subcategory_name: string;
  total: number;
  goal: number | null;
  difference: number | null;
}

export interface NetWorthSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface AccountSummaryResponse {
  success: boolean;
  data?: AccountSummary[];
  netWorth?: NetWorthSummary;
  error?: string;
}

export interface CategorySummaryResponse {
  success: boolean;
  data?: CategorySummary[];
  hasUncategorizedTransactions?: boolean;
  error?: string;
}

export interface NetWorthResponse {
  success: boolean;
  data?: NetWorthSummary;
  error?: string;
}

// ============== ACCOUNT SUMMARY ==============

/**
 * Get account summary with transactions for a date range
 * Returns starting balance, changes, and ending balance for each account
 */
export async function getAccountSummary(
  startDate: string,
  endDate: string
): Promise<AccountSummaryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, type, initial_balance")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (accountsError) {
      return { success: false, error: accountsError.message };
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        data: [],
        netWorth: { total_assets: 0, total_liabilities: 0, net_worth: 0 },
      };
    }

    // Process each account
    const accountSummaries: AccountSummary[] = await Promise.all(
      accounts.map(async (account) => {
        // Get transactions before start date for starting balance
        const { data: priorTransactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .lt("date", startDate)
          .is("deleted_at", null);

        const priorSum = (priorTransactions || []).reduce((sum, txn) => sum + txn.amount, 0);
        const startingBalance = account.initial_balance + priorSum;

        // Get transactions in the date range with details
        const { data: rangeTransactions } = await supabase
          .from("transactions")
          .select(
            `
            id,
            date,
            name,
            amount,
            subcategory:subcategories!subcategory_id(
              name,
              category:categories!category_id(name)
            )
          `
          )
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .is("deleted_at", null)
          .order("date", { ascending: true })
          .order("created_at", { ascending: true });

        // Calculate total change and running balances
        let runningBalance = startingBalance;
        const totalChange = (rangeTransactions || []).reduce((sum, txn) => sum + txn.amount, 0);

        const transactions: AccountTransaction[] = (rangeTransactions || []).map((txn) => {
          runningBalance += txn.amount;
          // Supabase returns nested relations - handle type casting
          const subcategoryData = txn.subcategory as unknown;
          let subcategoryName: string | null = null;
          let categoryName: string | null = null;

          if (subcategoryData && typeof subcategoryData === "object") {
            const sub = subcategoryData as { name?: string; category?: { name?: string } | null };
            subcategoryName = sub.name || null;
            if (sub.category && typeof sub.category === "object") {
              categoryName = sub.category.name || null;
            }
          }

          return {
            id: txn.id,
            date: txn.date,
            name: txn.name,
            amount: txn.amount,
            running_balance: runningBalance,
            subcategory_name: subcategoryName,
            category_name: categoryName,
          };
        });

        return {
          account_id: account.id,
          account_name: account.name,
          account_type: account.type as AccountType,
          starting_balance: startingBalance,
          total_change: totalChange,
          ending_balance: startingBalance + totalChange,
          transactions,
        };
      })
    );

    // Calculate net worth
    let totalAssets = 0;
    let totalLiabilities = 0;

    accountSummaries.forEach((summary) => {
      if (summary.account_type === "asset") {
        totalAssets += summary.ending_balance;
      } else {
        totalLiabilities += summary.ending_balance;
      }
    });

    return {
      success: true,
      data: accountSummaries,
      netWorth: {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== CATEGORY SUMMARY ==============

/**
 * Get category summary with subcategories for a date range
 * Returns total spent/earned for each category and subcategory
 */
export async function getCategorySummary(
  startDate: string,
  endDate: string
): Promise<CategorySummaryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all categories with subcategories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        type,
        subcategories!category_id(
          id,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (categoriesError) {
      return { success: false, error: categoriesError.message };
    }

    if (!categories || categories.length === 0) {
      return { success: true, data: [] };
    }

    // Get all transactions in the date range
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, subcategory_id")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .is("deleted_at", null);

    if (transactionsError) {
      return { success: false, error: transactionsError.message };
    }

    // Get spending goals for subcategories
    const { data: spendingGoals } = await supabase
      .from("spending_goals")
      .select("subcategory_id, amount, period")
      .eq("user_id", user.id);

    // Create a map of subcategory totals
    const subcategoryTotals: Record<string, number> = {};
    (transactions || []).forEach((txn) => {
      if (txn.subcategory_id) {
        subcategoryTotals[txn.subcategory_id] =
          (subcategoryTotals[txn.subcategory_id] || 0) + txn.amount;
      }
    });

    // Calculate the number of days in the date range for goal scaling
    const start = new Date(startDate);
    const end = new Date(endDate);
    const rangeInDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // Period to days conversion
    const periodToDays: Record<string, number> = {
      weekly: 7,
      monthly: 30.44, // Average days in a month
      quarterly: 91.31, // Average days in a quarter
      annual: 365.25,
    };

    // Create a map of subcategory goals scaled to the date range
    const subcategoryGoals: Record<string, number> = {};
    (spendingGoals || []).forEach((goal) => {
      // Scale goal amount to match the date range
      const goalPeriodDays = periodToDays[goal.period] || 30.44;
      const scaledGoal = (goal.amount / goalPeriodDays) * rangeInDays;
      subcategoryGoals[goal.subcategory_id] = scaledGoal;
    });

    // Build category summaries
    const categorySummaries: CategorySummary[] = categories.map((category) => {
      const subcategories = (category.subcategories as Array<{ id: string; name: string }>).filter(
        (sub) => sub
      );

      const subcategorySummaries: SubcategorySummary[] = subcategories.map((subcategory) => {
        const total = subcategoryTotals[subcategory.id] || 0;
        const goal = subcategoryGoals[subcategory.id] || null;
        const difference = goal !== null ? goal - Math.abs(total) : null;

        return {
          subcategory_id: subcategory.id,
          subcategory_name: subcategory.name,
          total,
          goal,
          difference,
        };
      });

      // Calculate category totals
      const categoryTotal = subcategorySummaries.reduce((sum, sub) => sum + sub.total, 0);
      const categoryGoal = subcategorySummaries.some((sub) => sub.goal !== null)
        ? subcategorySummaries.reduce((sum, sub) => sum + (sub.goal || 0), 0)
        : null;
      const categoryDifference =
        categoryGoal !== null ? categoryGoal - Math.abs(categoryTotal) : null;

      return {
        category_id: category.id,
        category_name: category.name,
        category_type: category.type as CategoryType,
        total: categoryTotal,
        goal: categoryGoal,
        difference: categoryDifference,
        subcategories: subcategorySummaries,
      };
    });

    // Check if there are any uncategorized transactions
    const hasUncategorizedTransactions = (transactions || []).some((txn) => !txn.subcategory_id);

    return { success: true, data: categorySummaries, hasUncategorizedTransactions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== NET WORTH ==============

/**
 * Calculate net worth at a specific date
 * Net worth = Total Assets - Total Liabilities
 */
export async function calculateNetWorth(atDate: string): Promise<NetWorthResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, type, initial_balance")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (accountsError) {
      return { success: false, error: accountsError.message };
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        data: { total_assets: 0, total_liabilities: 0, net_worth: 0 },
      };
    }

    // Calculate balance for each account up to the specified date
    let totalAssets = 0;
    let totalLiabilities = 0;

    await Promise.all(
      accounts.map(async (account) => {
        // Get sum of transactions up to the date
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .lte("date", atDate)
          .is("deleted_at", null);

        const transactionSum = (transactions || []).reduce((sum, txn) => sum + txn.amount, 0);
        const balance = account.initial_balance + transactionSum;

        if (account.type === "asset") {
          totalAssets += balance;
        } else {
          totalLiabilities += balance;
        }
      })
    );

    return {
      success: true,
      data: {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== DASHBOARD METRICS ==============

/**
 * Get quick dashboard metrics (income, expenses for a period)
 */
export async function getDashboardMetrics(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  data?: {
    totalIncome: number;
    totalExpenses: number;
    netChange: number;
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

    // Get all transactions in the date range with category info
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        amount,
        subcategory:subcategories!subcategory_id(
          category:categories!category_id(type)
        )
      `
      )
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .is("deleted_at", null);

    if (transactionsError) {
      return { success: false, error: transactionsError.message };
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    (transactions || []).forEach((txn) => {
      // Supabase returns nested relations - handle type casting
      const subcategoryData = txn.subcategory as unknown;
      let categoryType: string | null = null;

      if (subcategoryData && typeof subcategoryData === "object") {
        const sub = subcategoryData as { category?: { type?: string } | null };
        if (sub.category && typeof sub.category === "object") {
          categoryType = sub.category.type || null;
        }
      }

      if (categoryType === "income") {
        totalIncome += txn.amount;
      } else if (categoryType === "expense") {
        totalExpenses += Math.abs(txn.amount);
      } else {
        // Uncategorized - use amount sign to determine
        if (txn.amount > 0) {
          totalIncome += txn.amount;
        } else {
          totalExpenses += Math.abs(txn.amount);
        }
      }
    });

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netChange: totalIncome - totalExpenses,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
