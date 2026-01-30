// Vercel Serverless Function - AI Chatbot with Function Calling
// Uses Google Gemini for conversational AI with financial context

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ============== TYPES ==============

interface ChatRequest {
  message: string;
  session_id?: string;
  current_page?: string;
  access_token: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  function_calls: object | null;
  created_at: string;
}

interface Account {
  id: string;
  name: string;
  type: "asset" | "liability";
  initial_balance: number;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
}

interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  account_name: string;
  subcategory_name: string | null;
  category_name: string | null;
}

interface UserContext {
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  recentTransactions: Transaction[];
  personality: "professional" | "friendly" | "stern";
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

interface FunctionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// ============== FUNCTION DEFINITIONS ==============

const AVAILABLE_FUNCTIONS = [
  {
    name: "create_account",
    description: "Create a new financial account for the user",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the account (e.g., 'Chase Checking')" },
        type: {
          type: "string",
          enum: ["asset", "liability"],
          description: "Whether this is an asset (bank account) or liability (credit card)",
        },
        initial_balance: { type: "number", description: "The starting balance of the account" },
      },
      required: ["name", "type", "initial_balance"],
    },
  },
  {
    name: "create_category",
    description: "Create a new category for organizing transactions",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the category" },
        type: {
          type: "string",
          enum: ["income", "expense"],
          description: "Whether this is for income or expenses",
        },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "create_subcategory",
    description: "Create a new subcategory under an existing category",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the subcategory" },
        category_name: { type: "string", description: "The name of the parent category" },
      },
      required: ["name", "category_name"],
    },
  },
  {
    name: "add_transaction",
    description: "Add a new transaction (income or expense)",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Transaction date in YYYY-MM-DD format" },
        name: { type: "string", description: "Description of the transaction (merchant name)" },
        amount: {
          type: "number",
          description: "Transaction amount (positive for income, negative for expense)",
        },
        account_name: { type: "string", description: "Name of the account for this transaction" },
        subcategory_name: { type: "string", description: "Name of the subcategory (optional)" },
      },
      required: ["date", "name", "amount", "account_name"],
    },
  },
  {
    name: "get_spending_summary",
    description: "Get a summary of spending for a specific time period",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "last_month", "last_30_days", "last_90_days", "this_year"],
          description: "The time period to summarize",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "get_account_balance",
    description: "Get the current balance of a specific account or all accounts",
    parameters: {
      type: "object",
      properties: {
        account_name: {
          type: "string",
          description: "Name of the account (optional - if not provided, returns all accounts)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_spending_goal",
    description: "Create a spending budget goal for a specific expense subcategory",
    parameters: {
      type: "object",
      properties: {
        subcategory_name: {
          type: "string",
          description: "Name of the expense subcategory to set a budget for",
        },
        amount: {
          type: "number",
          description: "The budget amount limit",
        },
        period: {
          type: "string",
          enum: ["weekly", "monthly", "quarterly", "annual"],
          description: "How often this budget resets",
        },
      },
      required: ["subcategory_name", "amount", "period"],
    },
  },
  {
    name: "create_saving_goal",
    description: "Create a new saving goal to track progress towards a financial target",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the saving goal (e.g., 'Emergency Fund', 'Vacation')",
        },
        target_amount: {
          type: "number",
          description: "Target amount to save (optional if target_date provided)",
        },
        target_date: {
          type: "string",
          description:
            "Target date to reach the goal in YYYY-MM-DD format (optional if target_amount provided)",
        },
        current_amount: {
          type: "number",
          description: "Amount already saved towards this goal (default: 0)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_goals_summary",
    description: "Get a summary of all spending and saving goals with their progress",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "add_to_saving_goal",
    description: "Add an amount to a saving goal's progress",
    parameters: {
      type: "object",
      properties: {
        goal_name: {
          type: "string",
          description: "Name of the saving goal",
        },
        amount: {
          type: "number",
          description: "Amount to add to the goal",
        },
      },
      required: ["goal_name", "amount"],
    },
  },
];

// ============== HELPER FUNCTIONS ==============

function getPersonalityPrompt(personality: "professional" | "friendly" | "stern"): string {
  switch (personality) {
    case "professional":
      return `You are a professional financial advisor. Be clear, concise, and formal. Focus on providing accurate financial guidance without unnecessary pleasantries. Use precise language and provide actionable recommendations.`;
    case "friendly":
      return `You are a friendly and approachable financial assistant! Be warm, encouraging, and supportive. Use casual language and celebrate the user's financial wins. Make financial management feel less intimidating and more accessible.`;
    case "stern":
      return `You are a strict and no-nonsense financial coach. Be direct and hold the user accountable. Don't sugarcoat financial realities - if they're overspending, tell them firmly. Focus on discipline and long-term financial health.`;
    default:
      return `You are a helpful financial assistant. Be clear and supportive in your responses.`;
  }
}

function buildSystemPrompt(context: UserContext, currentPage?: string): string {
  const personalityPrompt = getPersonalityPrompt(context.personality);

  let accountsSummary = "No accounts set up yet.";
  if (context.accounts.length > 0) {
    accountsSummary = context.accounts
      .map((a) => `- ${a.name} (${a.type}): $${a.initial_balance.toFixed(2)}`)
      .join("\n");
  }

  let categoriesSummary = "No custom categories set up.";
  if (context.categories.length > 0) {
    const income = context.categories
      .filter((c) => c.type === "income")
      .map((c) => c.name)
      .join(", ");
    const expense = context.categories
      .filter((c) => c.type === "expense")
      .map((c) => c.name)
      .join(", ");
    categoriesSummary = `Income: ${income || "None"}\nExpense: ${expense || "None"}`;
  }

  let recentTransactionsSummary = "No recent transactions.";
  if (context.recentTransactions.length > 0) {
    recentTransactionsSummary = context.recentTransactions
      .slice(0, 10)
      .map((t) => {
        const sign = t.amount >= 0 ? "+" : "";
        return `- ${t.date}: ${t.name} ${sign}$${Math.abs(t.amount).toFixed(2)} (${t.subcategory_name || "Uncategorized"})`;
      })
      .join("\n");
  }

  const pageContext = currentPage ? `\n\nThe user is currently viewing: ${currentPage}` : "";

  return `${personalityPrompt}

You are an AI financial assistant for a personal budget application. You help users manage their finances, track spending, set goals, and make better financial decisions.

## USER'S FINANCIAL CONTEXT

### Accounts
${accountsSummary}

### Categories
${categoriesSummary}

### Financial Summary
- Total Balance: $${context.totalBalance.toFixed(2)}
- This Month's Income: $${context.monthlyIncome.toFixed(2)}
- This Month's Expenses: $${Math.abs(context.monthlyExpenses).toFixed(2)}
- Net This Month: $${(context.monthlyIncome + context.monthlyExpenses).toFixed(2)}

### Recent Transactions
${recentTransactionsSummary}
${pageContext}

## CAPABILITIES

You can help users with:
1. Understanding their spending patterns
2. Creating and managing accounts, categories, and subcategories
3. Adding transactions
4. Answering questions about their finances
5. Providing budgeting advice and tips
6. Setting and tracking spending goals (budgets for expense categories)
7. Setting and tracking saving goals (targets for savings)
8. Reporting on goal progress

## FUNCTION CALLING

When users ask you to perform actions (create accounts, add transactions, set goals, etc.), use the available functions. Always confirm the action before executing and provide a summary after completion.

## GUIDELINES

1. Be helpful and accurate with financial information
2. When uncertain, ask clarifying questions
3. Provide context-aware suggestions based on the user's data
4. Keep responses concise but informative
5. If the user has no data yet, guide them through setup
6. Never share sensitive information or make up financial data
7. Use markdown formatting for better readability when appropriate`;
}

async function fetchUserContext(supabase: AnySupabaseClient, userId: string): Promise<UserContext> {
  // Fetch accounts
  const { data: accountsData } = await supabase
    .from("accounts")
    .select("id, name, type, initial_balance")
    .eq("user_id", userId)
    .is("deleted_at", null);

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .is("deleted_at", null);

  // Fetch subcategories with category names
  const { data: subcategoriesData } = await supabase
    .from("subcategories")
    .select(
      `
      id,
      name,
      category_id,
      categories!inner (name)
    `
    )
    .eq("user_id", userId)
    .is("deleted_at", null);

  // Fetch recent transactions (last 20)
  const { data: transactionsData } = await supabase
    .from("transactions")
    .select(
      `
      id,
      date,
      name,
      amount,
      accounts!inner (name),
      subcategories (
        name,
        categories!inner (name)
      )
    `
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(20);

  // Fetch user preferences
  const { data: prefsData } = await supabase
    .from("user_preferences")
    .select("ai_personality")
    .eq("user_id", userId)
    .single();

  // Calculate monthly totals
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: monthlyData } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  (monthlyData || []).forEach((t) => {
    if (t.amount >= 0) {
      monthlyIncome += t.amount;
    } else {
      monthlyExpenses += t.amount;
    }
  });

  // Calculate total balance (sum of account initial balances + all transaction amounts)
  const { data: allTransactionsData } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const transactionSum = (allTransactionsData || []).reduce((sum, t) => sum + t.amount, 0);
  const initialBalanceSum = (accountsData || []).reduce((sum, a) => sum + a.initial_balance, 0);
  const totalBalance = initialBalanceSum + transactionSum;

  return {
    accounts: (accountsData || []) as Account[],
    categories: (categoriesData || []) as Category[],
    subcategories: (subcategoriesData || []).map((s) => {
      const cat = s.categories as unknown as { name: string };
      return {
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        category_name: cat.name,
      };
    }),
    recentTransactions: (transactionsData || []).map((t) => {
      const acc = t.accounts as unknown as { name: string };
      const sub = t.subcategories as unknown as {
        name: string;
        categories: { name: string };
      } | null;
      return {
        id: t.id,
        date: t.date,
        name: t.name,
        amount: t.amount,
        account_name: acc.name,
        subcategory_name: sub?.name || null,
        category_name: sub?.categories?.name || null,
      };
    }),
    personality: prefsData?.ai_personality || "friendly",
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
  };
}

async function executeFunctionCall(
  supabase: AnySupabaseClient,
  userId: string,
  functionCall: FunctionCall,
  context: UserContext
): Promise<FunctionResult> {
  const { name, args } = functionCall;

  try {
    switch (name) {
      case "create_account": {
        const {
          name: accountName,
          type,
          initial_balance,
        } = args as {
          name: string;
          type: "asset" | "liability";
          initial_balance: number;
        };

        const { error } = await supabase.from("accounts").insert({
          user_id: userId,
          name: accountName,
          type,
          initial_balance,
        });

        if (error) {
          return { success: false, message: `Failed to create account: ${error.message}` };
        }
        return {
          success: true,
          message: `Created ${type} account "${accountName}" with initial balance of $${initial_balance.toFixed(2)}`,
        };
      }

      case "create_category": {
        const { name: categoryName, type } = args as {
          name: string;
          type: "income" | "expense";
        };

        const { error } = await supabase.from("categories").insert({
          user_id: userId,
          name: categoryName,
          type,
          is_system: false,
        });

        if (error) {
          return { success: false, message: `Failed to create category: ${error.message}` };
        }
        return { success: true, message: `Created ${type} category "${categoryName}"` };
      }

      case "create_subcategory": {
        const { name: subcategoryName, category_name } = args as {
          name: string;
          category_name: string;
        };

        // Find the category
        const category = context.categories.find(
          (c) => c.name.toLowerCase() === category_name.toLowerCase()
        );
        if (!category) {
          return { success: false, message: `Category "${category_name}" not found` };
        }

        const { error } = await supabase.from("subcategories").insert({
          user_id: userId,
          name: subcategoryName,
          category_id: category.id,
          is_system: false,
        });

        if (error) {
          return { success: false, message: `Failed to create subcategory: ${error.message}` };
        }
        return {
          success: true,
          message: `Created subcategory "${subcategoryName}" under "${category_name}"`,
        };
      }

      case "add_transaction": {
        const {
          date,
          name: txName,
          amount,
          account_name,
          subcategory_name,
        } = args as {
          date: string;
          name: string;
          amount: number;
          account_name: string;
          subcategory_name?: string;
        };

        // Find the account
        const account = context.accounts.find(
          (a) => a.name.toLowerCase() === account_name.toLowerCase()
        );
        if (!account) {
          return { success: false, message: `Account "${account_name}" not found` };
        }

        // Find subcategory if provided
        let subcategoryId = null;
        if (subcategory_name) {
          const subcategory = context.subcategories.find(
            (s) => s.name.toLowerCase() === subcategory_name.toLowerCase()
          );
          if (subcategory) {
            subcategoryId = subcategory.id;
          }
        }

        const { error } = await supabase.from("transactions").insert({
          user_id: userId,
          account_id: account.id,
          date,
          name: txName,
          amount,
          subcategory_id: subcategoryId,
          is_initial_balance: false,
          is_transfer: false,
          ai_suggested: false,
          user_corrected: false,
        });

        if (error) {
          return { success: false, message: `Failed to add transaction: ${error.message}` };
        }

        const amountStr =
          amount >= 0 ? `+$${amount.toFixed(2)} income` : `$${Math.abs(amount).toFixed(2)} expense`;
        return {
          success: true,
          message: `Added transaction: ${txName} (${amountStr}) to ${account_name} on ${date}`,
        };
      }

      case "get_spending_summary": {
        const { period } = args as { period: string };

        const now = new Date();
        let startDate: Date;
        let endDate = now;

        switch (period) {
          case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case "last_30_days":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "last_90_days":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const { data: transactions } = await supabase
          .from("transactions")
          .select(
            `
            amount,
            subcategories (
              name,
              categories!inner (name, type)
            )
          `
          )
          .eq("user_id", userId)
          .is("deleted_at", null)
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryTotals: Record<string, number> = {};

        (transactions || []).forEach((t) => {
          if (t.amount >= 0) {
            totalIncome += t.amount;
          } else {
            totalExpenses += t.amount;
            const sub = t.subcategories as unknown as {
              name: string;
              categories: { name: string; type: string };
            } | null;
            const catName = sub?.categories?.name || "Uncategorized";
            categoryTotals[catName] = (categoryTotals[catName] || 0) + Math.abs(t.amount);
          }
        });

        const summary = {
          period,
          totalIncome,
          totalExpenses: Math.abs(totalExpenses),
          netChange: totalIncome + totalExpenses,
          topCategories: Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount })),
        };

        return { success: true, message: "Spending summary retrieved", data: summary };
      }

      case "get_account_balance": {
        const { account_name } = args as { account_name?: string };

        if (account_name) {
          const account = context.accounts.find(
            (a) => a.name.toLowerCase() === account_name.toLowerCase()
          );
          if (!account) {
            return { success: false, message: `Account "${account_name}" not found` };
          }

          // Get transactions for this account
          const { data: txData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("account_id", account.id)
            .is("deleted_at", null);

          const txSum = (txData || []).reduce((sum, t) => sum + t.amount, 0);
          const balance = account.initial_balance + txSum;

          return {
            success: true,
            message: `Balance for ${account.name}: $${balance.toFixed(2)}`,
            data: { account: account.name, balance },
          };
        } else {
          // Return all account balances
          const balances = [];
          for (const account of context.accounts) {
            const { data: txData } = await supabase
              .from("transactions")
              .select("amount")
              .eq("user_id", userId)
              .eq("account_id", account.id)
              .is("deleted_at", null);

            const txSum = (txData || []).reduce((sum, t) => sum + t.amount, 0);
            const balance = account.initial_balance + txSum;
            balances.push({ account: account.name, type: account.type, balance });
          }

          return {
            success: true,
            message: "Account balances retrieved",
            data: balances,
          };
        }
      }

      case "create_spending_goal": {
        const { subcategory_name, amount, period } = args as {
          subcategory_name: string;
          amount: number;
          period: "weekly" | "monthly" | "quarterly" | "annual";
        };

        // Find the subcategory
        const subcategory = context.subcategories.find(
          (s) => s.name.toLowerCase() === subcategory_name.toLowerCase()
        );
        if (!subcategory) {
          return { success: false, message: `Subcategory "${subcategory_name}" not found` };
        }

        // Check if goal already exists
        const { data: existingGoal } = await supabase
          .from("spending_goals")
          .select("id")
          .eq("user_id", userId)
          .eq("subcategory_id", subcategory.id)
          .single();

        if (existingGoal) {
          return {
            success: false,
            message: `A spending goal already exists for "${subcategory_name}". Delete it first or edit it on the Goals page.`,
          };
        }

        const { error } = await supabase.from("spending_goals").insert({
          user_id: userId,
          subcategory_id: subcategory.id,
          amount,
          period,
          start_date: new Date().toISOString().split("T")[0],
        });

        if (error) {
          return { success: false, message: `Failed to create spending goal: ${error.message}` };
        }

        return {
          success: true,
          message: `Created ${period} spending goal of $${amount.toFixed(2)} for "${subcategory_name}"`,
        };
      }

      case "create_saving_goal": {
        const {
          name: goalName,
          target_amount,
          target_date,
          current_amount,
        } = args as {
          name: string;
          target_amount?: number;
          target_date?: string;
          current_amount?: number;
        };

        if (!target_amount && !target_date) {
          return {
            success: false,
            message: "Either target amount or target date must be specified",
          };
        }

        const { error } = await supabase.from("saving_goals").insert({
          user_id: userId,
          name: goalName,
          target_amount: target_amount || null,
          target_date: target_date || null,
          current_amount: current_amount || 0,
        });

        if (error) {
          return { success: false, message: `Failed to create saving goal: ${error.message}` };
        }

        let description = `Created saving goal "${goalName}"`;
        if (target_amount) {
          description += ` with target of $${target_amount.toFixed(2)}`;
        }
        if (target_date) {
          description += ` by ${target_date}`;
        }

        return { success: true, message: description };
      }

      case "get_goals_summary": {
        // Fetch spending goals
        const { data: spendingGoals } = await supabase
          .from("spending_goals")
          .select(
            `
            id, amount, period, start_date,
            subcategories!inner (
              name,
              categories!inner (name)
            )
          `
          )
          .eq("user_id", userId);

        // Fetch saving goals
        const { data: savingGoals } = await supabase
          .from("saving_goals")
          .select("*")
          .eq("user_id", userId)
          .is("completed_at", null);

        const spendingSummary = (spendingGoals || []).map((g) => {
          const sub = g.subcategories as unknown as { name: string; categories: { name: string } };
          return {
            subcategory: sub.name,
            category: sub.categories.name,
            budget: g.amount,
            period: g.period,
          };
        });

        const savingSummary = (savingGoals || []).map((g) => ({
          name: g.name,
          targetAmount: g.target_amount,
          targetDate: g.target_date,
          currentAmount: g.current_amount,
          percentComplete: g.target_amount
            ? Math.round((g.current_amount / g.target_amount) * 100)
            : null,
        }));

        return {
          success: true,
          message: `Found ${spendingSummary.length} spending goals and ${savingSummary.length} saving goals`,
          data: {
            spendingGoals: spendingSummary,
            savingGoals: savingSummary,
          },
        };
      }

      case "add_to_saving_goal": {
        const { goal_name, amount: addAmount } = args as {
          goal_name: string;
          amount: number;
        };

        // Find the goal
        const { data: goal, error: findError } = await supabase
          .from("saving_goals")
          .select("id, name, current_amount, target_amount")
          .eq("user_id", userId)
          .ilike("name", goal_name)
          .is("completed_at", null)
          .single();

        if (findError || !goal) {
          return { success: false, message: `Saving goal "${goal_name}" not found` };
        }

        const newAmount = (goal.current_amount || 0) + addAmount;
        const updates: { current_amount: number; completed_at?: string } = {
          current_amount: newAmount,
        };

        // Auto-complete if target reached
        if (goal.target_amount && newAmount >= goal.target_amount) {
          updates.completed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("saving_goals")
          .update(updates)
          .eq("id", goal.id);

        if (updateError) {
          return { success: false, message: `Failed to update goal: ${updateError.message}` };
        }

        let message = `Added $${addAmount.toFixed(2)} to "${goal.name}". New total: $${newAmount.toFixed(2)}`;
        if (goal.target_amount) {
          const percent = Math.round((newAmount / goal.target_amount) * 100);
          message += ` (${percent}% of $${goal.target_amount.toFixed(2)} target)`;
          if (newAmount >= goal.target_amount) {
            message += " - Goal completed!";
          }
        }

        return { success: true, message };
      }

      default:
        return { success: false, message: `Unknown function: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== GEMINI API ==============

async function callGeminiChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  apiKey: string
): Promise<{ text: string; functionCalls?: FunctionCall[] }> {
  // Build Gemini-formatted messages
  const geminiContents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: geminiContents,
        tools: [
          {
            functionDeclarations: AVAILABLE_FUNCTIONS,
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  // Log token usage for cost monitoring
  const usageMetadata = data.usageMetadata;
  if (usageMetadata) {
    console.log("Gemini Chat API usage:", {
      promptTokens: usageMetadata.promptTokenCount,
      responseTokens: usageMetadata.candidatesTokenCount,
      totalTokens: usageMetadata.totalTokenCount,
    });
  }

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error("No response from Gemini API");
  }

  const parts = candidate.content?.parts || [];

  // Check for function calls
  const functionCalls: FunctionCall[] = [];
  let textResponse = "";

  for (const part of parts) {
    if (part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      });
    } else if (part.text) {
      textResponse += part.text;
    }
  }

  return {
    text: textResponse,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
  };
}

// ============== MAIN HANDLER ==============

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!geminiApiKey) {
      console.error("Missing Gemini API key");
      return res.status(500).json({ error: "AI service not configured" });
    }

    // Parse request body
    const body = req.body as ChatRequest;

    if (!body.access_token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!body.message || body.message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token and get user ID
    const { data: userData, error: authError } = await supabase.auth.getUser(body.access_token);

    if (authError || !userData.user) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const userId = userData.user.id;

    // Fetch user context
    const context = await fetchUserContext(supabase, userId);

    // Get or create session
    let sessionId = body.session_id;
    if (!sessionId) {
      // Create new session with title from first message
      const title = body.message.slice(0, 50) + (body.message.length > 50 ? "..." : "");
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return res.status(500).json({ error: "Failed to create chat session" });
      }

      sessionId = newSession.id;
    }

    // Fetch chat history (last 20 messages)
    const { data: historyData } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    const chatHistory = (historyData || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add current message to history
    chatHistory.push({ role: "user", content: body.message });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context, body.current_page);

    // Call Gemini
    const aiResponse = await callGeminiChat(chatHistory, systemPrompt, geminiApiKey);

    // Execute function calls if any
    let functionResults: FunctionResult[] = [];
    let finalResponse = aiResponse.text;

    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      // Execute each function call
      for (const fc of aiResponse.functionCalls) {
        const result = await executeFunctionCall(supabase, userId, fc, context);
        functionResults.push(result);
      }

      // Build a response that includes function results
      const functionResultsText = functionResults
        .map((r) => {
          if (r.success) {
            return `✅ ${r.message}`;
          } else {
            return `❌ ${r.message}`;
          }
        })
        .join("\n");

      // If AI didn't provide text response with function calls, create one
      if (!finalResponse) {
        finalResponse = functionResultsText;
      } else {
        finalResponse = `${finalResponse}\n\n${functionResultsText}`;
      }
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "user",
      content: body.message,
    });

    // Save assistant message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "assistant",
      content: finalResponse,
      function_calls: functionResults.length > 0 ? functionResults : null,
    });

    // Update session last_message_at
    await supabase
      .from("chat_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Return response
    return res.status(200).json({
      session_id: sessionId,
      message: finalResponse,
      function_calls: functionResults.length > 0 ? functionResults : undefined,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
