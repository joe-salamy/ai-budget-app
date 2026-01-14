// Chart service - Prepare data for dashboard visualizations
import { supabase } from "../lib/supabaseClient";
import {
  format,
  parseISO,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import type { AccountType, CategoryType } from "../types";

// ============== TYPES ==============

export interface NetWorthDataPoint {
  date: string;
  formattedDate: string;
  netWorth: number;
  [accountName: string]: string | number; // Dynamic account balances
}

export interface SankeyNode {
  id: string;
  nodeColor?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface NetWorthChartResponse {
  success: boolean;
  data?: NetWorthDataPoint[];
  accounts?: Array<{ name: string; type: AccountType }>;
  error?: string;
}

export interface SankeyChartResponse {
  success: boolean;
  data?: SankeyData;
  error?: string;
}

// ============== NET WORTH CHART DATA ==============

/**
 * Prepare data for net worth over time line chart
 * Time granularity based on date range:
 * - < 28 days: daily
 * - < 180 days: weekly
 * - >= 180 days: monthly
 */
export async function prepareNetWorthData(
  startDate: string,
  endDate: string
): Promise<NetWorthChartResponse> {
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
      return { success: true, data: [], accounts: [] };
    }

    // Get all transactions up to the end date (we need historical data)
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("account_id, date, amount")
      .eq("user_id", user.id)
      .lte("date", endDate)
      .is("deleted_at", null)
      .order("date", { ascending: true });

    if (transactionsError) {
      return { success: false, error: transactionsError.message };
    }

    // Determine time granularity
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const daysDiff = differenceInDays(end, start);

    let datePoints: Date[];
    let dateFormat: string;

    if (daysDiff < 28) {
      // Daily granularity
      datePoints = eachDayOfInterval({ start, end });
      dateFormat = "MMM d";
    } else if (daysDiff < 180) {
      // Weekly granularity
      datePoints = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
      dateFormat = "MMM d";
    } else {
      // Monthly granularity
      datePoints = eachMonthOfInterval({ start, end });
      dateFormat = "MMM yyyy";
    }

    // Build a map of transactions by account and date
    const accountTransactions: Record<string, Array<{ date: string; amount: number }>> = {};
    accounts.forEach((account) => {
      accountTransactions[account.id] = [];
    });

    (transactions || []).forEach((txn) => {
      if (accountTransactions[txn.account_id]) {
        accountTransactions[txn.account_id].push({
          date: txn.date,
          amount: txn.amount,
        });
      }
    });

    // Calculate balances at each date point
    const dataPoints: NetWorthDataPoint[] = datePoints.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const formattedDate = format(date, dateFormat);

      const point: NetWorthDataPoint = {
        date: dateStr,
        formattedDate,
        netWorth: 0,
      };

      let netWorth = 0;

      accounts.forEach((account) => {
        // Calculate account balance up to this date
        const txns = accountTransactions[account.id] || [];
        const balanceFromTransactions = txns
          .filter((txn) => txn.date <= dateStr)
          .reduce((sum, txn) => sum + txn.amount, 0);

        const accountBalance = account.initial_balance + balanceFromTransactions;
        point[account.name] = accountBalance;

        // Add to net worth calculation
        if (account.type === "asset") {
          netWorth += accountBalance;
        } else {
          netWorth -= accountBalance;
        }
      });

      point.netWorth = netWorth;
      return point;
    });

    return {
      success: true,
      data: dataPoints,
      accounts: accounts.map((a) => ({ name: a.name, type: a.type as AccountType })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== SANKEY DIAGRAM DATA ==============

/**
 * Prepare data for Sankey cash flow diagram
 * Flow visualization: Income subcategories → Income categories → Expense categories → Expense subcategories
 */
export async function prepareSankeyData(
  startDate: string,
  endDate: string
): Promise<SankeyChartResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get categories with subcategories
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
      .is("deleted_at", null);

    if (categoriesError) {
      return { success: false, error: categoriesError.message };
    }

    if (!categories || categories.length === 0) {
      return { success: true, data: { nodes: [], links: [] } };
    }

    // Get transactions in the date range with subcategory info
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

    // Build subcategory to category mapping
    const subcategoryToCategory: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryType: CategoryType;
        subcategoryName: string;
      }
    > = {};

    categories.forEach((category) => {
      const subs = (category.subcategories as Array<{ id: string; name: string }>) || [];
      subs.forEach((sub) => {
        subcategoryToCategory[sub.id] = {
          categoryId: category.id,
          categoryName: category.name,
          categoryType: category.type as CategoryType,
          subcategoryName: sub.name,
        };
      });
    });

    // Aggregate totals by subcategory
    const subcategoryTotals: Record<string, number> = {};

    (transactions || []).forEach((txn) => {
      if (txn.subcategory_id && subcategoryToCategory[txn.subcategory_id]) {
        const absAmount = Math.abs(txn.amount);
        subcategoryTotals[txn.subcategory_id] =
          (subcategoryTotals[txn.subcategory_id] || 0) + absAmount;
      }
    });

    // Build nodes and links
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const nodeSet = new Set<string>();

    // Calculate totals per category
    const incomeCategoryTotals: Record<string, number> = {};
    const expenseCategoryTotals: Record<string, number> = {};

    Object.entries(subcategoryTotals).forEach(([subcategoryId, total]) => {
      const mapping = subcategoryToCategory[subcategoryId];
      if (!mapping) return;

      if (mapping.categoryType === "income") {
        incomeCategoryTotals[mapping.categoryName] =
          (incomeCategoryTotals[mapping.categoryName] || 0) + total;
      } else {
        expenseCategoryTotals[mapping.categoryName] =
          (expenseCategoryTotals[mapping.categoryName] || 0) + total;
      }
    });

    const totalIncome = Object.values(incomeCategoryTotals).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenseCategoryTotals).reduce((sum, val) => sum + val, 0);

    // If no income or no expenses, return minimal data
    if (totalIncome === 0 && totalExpenses === 0) {
      return { success: true, data: { nodes: [], links: [] } };
    }

    // Add income nodes and links
    // Income Subcategories → Income Categories
    Object.entries(subcategoryTotals).forEach(([subcategoryId, total]) => {
      const mapping = subcategoryToCategory[subcategoryId];
      if (!mapping || mapping.categoryType !== "income" || total === 0) return;

      const subcategoryNodeId = `Income:${mapping.categoryName}:${mapping.subcategoryName}`;
      const categoryNodeId = `Income:${mapping.categoryName}`;

      if (!nodeSet.has(subcategoryNodeId)) {
        nodes.push({ id: subcategoryNodeId, nodeColor: "#22c55e" }); // green-500
        nodeSet.add(subcategoryNodeId);
      }

      if (!nodeSet.has(categoryNodeId)) {
        nodes.push({ id: categoryNodeId, nodeColor: "#16a34a" }); // green-600
        nodeSet.add(categoryNodeId);
      }

      links.push({
        source: subcategoryNodeId,
        target: categoryNodeId,
        value: total,
      });
    });

    // Income Categories → "Total Income" (center node)
    if (totalIncome > 0) {
      const incomeNodeId = "Total Income";
      if (!nodeSet.has(incomeNodeId)) {
        nodes.push({ id: incomeNodeId, nodeColor: "#15803d" }); // green-700
        nodeSet.add(incomeNodeId);
      }

      Object.entries(incomeCategoryTotals).forEach(([categoryName, total]) => {
        if (total > 0) {
          links.push({
            source: `Income:${categoryName}`,
            target: incomeNodeId,
            value: total,
          });
        }
      });
    }

    // Add expense nodes and links
    // "Total Expenses" (center) → Expense Categories → Expense Subcategories
    if (totalExpenses > 0) {
      const expenseNodeId = "Total Expenses";
      if (!nodeSet.has(expenseNodeId)) {
        nodes.push({ id: expenseNodeId, nodeColor: "#dc2626" }); // red-600
        nodeSet.add(expenseNodeId);
      }

      // If there's income, link it to expenses
      if (totalIncome > 0) {
        const flowAmount = Math.min(totalIncome, totalExpenses);
        links.push({
          source: "Total Income",
          target: expenseNodeId,
          value: flowAmount,
        });
      }

      // Total Expenses → Expense Categories
      Object.entries(expenseCategoryTotals).forEach(([categoryName, total]) => {
        if (total > 0) {
          const categoryNodeId = `Expense:${categoryName}`;
          if (!nodeSet.has(categoryNodeId)) {
            nodes.push({ id: categoryNodeId, nodeColor: "#ef4444" }); // red-500
            nodeSet.add(categoryNodeId);
          }

          links.push({
            source: expenseNodeId,
            target: categoryNodeId,
            value: total,
          });
        }
      });

      // Expense Categories → Expense Subcategories
      Object.entries(subcategoryTotals).forEach(([subcategoryId, total]) => {
        const mapping = subcategoryToCategory[subcategoryId];
        if (!mapping || mapping.categoryType !== "expense" || total === 0) return;

        const categoryNodeId = `Expense:${mapping.categoryName}`;
        const subcategoryNodeId = `Expense:${mapping.categoryName}:${mapping.subcategoryName}`;

        if (!nodeSet.has(subcategoryNodeId)) {
          nodes.push({ id: subcategoryNodeId, nodeColor: "#f87171" }); // red-400
          nodeSet.add(subcategoryNodeId);
        }

        links.push({
          source: categoryNodeId,
          target: subcategoryNodeId,
          value: total,
        });
      });
    }

    // Add savings node if income > expenses
    if (totalIncome > totalExpenses) {
      const savings = totalIncome - totalExpenses;
      const savingsNodeId = "Savings";
      nodes.push({ id: savingsNodeId, nodeColor: "#3b82f6" }); // blue-500

      links.push({
        source: "Total Income",
        target: savingsNodeId,
        value: savings,
      });
    }

    return {
      success: true,
      data: { nodes, links },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
