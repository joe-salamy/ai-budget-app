// Transaction service - CRUD operations for transactions
import { supabase } from "../lib/supabaseClient";
import type { Transaction } from "../types";

// ============== TYPES ==============

export interface CreateTransactionData {
  account_id: string;
  date: string;
  name: string;
  amount: number;
  subcategory_id?: string | null;
  comment?: string | null;
  is_transfer?: boolean;
  transfer_to_account_id?: string | null;
  ai_suggested?: boolean;
  user_corrected?: boolean;
}

export interface UpdateTransactionData {
  account_id?: string;
  date?: string;
  name?: string;
  amount?: number;
  subcategory_id?: string | null;
  comment?: string | null;
  is_transfer?: boolean;
  transfer_to_account_id?: string | null;
  ai_suggested?: boolean;
  user_corrected?: boolean;
}

export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  error?: string;
}

export interface TransactionsResponse {
  success: boolean;
  data?: Transaction[];
  error?: string;
}

export interface TransactionFilters {
  accountId?: string;
  subcategoryId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

// Extended transaction with joined data for display
export interface TransactionWithDetails extends Transaction {
  account_name?: string;
  account_type?: string;
  subcategory_name?: string;
  category_id?: string;
  category_name?: string;
  category_type?: string;
  transfer_to_account_name?: string;
  running_balance?: number;
}

export interface TransactionsWithDetailsResponse {
  success: boolean;
  data?: TransactionWithDetails[];
  error?: string;
}

// ============== CREATE ==============

/**
 * Create a new transaction
 */
export async function createTransaction(
  transactionData: CreateTransactionData
): Promise<TransactionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: transactionData.account_id,
        date: transactionData.date,
        name: transactionData.name,
        amount: transactionData.amount,
        subcategory_id: transactionData.subcategory_id || null,
        comment: transactionData.comment || null,
        is_initial_balance: false,
        is_transfer: transactionData.is_transfer || false,
        transfer_to_account_id: transactionData.transfer_to_account_id || null,
        ai_suggested: transactionData.ai_suggested || false,
        user_corrected: transactionData.user_corrected || false,
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
 * Create a transfer transaction (creates two transactions: one debit, one credit)
 */
export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  date: string,
  name: string,
  amount: number,
  subcategoryId?: string | null,
  comment?: string | null
): Promise<{ success: boolean; data?: { outgoing: Transaction; incoming: Transaction }; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Create outgoing transaction (negative amount from source account)
    const { data: outgoing, error: outgoingError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: fromAccountId,
        date,
        name,
        amount: -Math.abs(amount), // Negative for outgoing
        subcategory_id: subcategoryId || null,
        comment,
        is_initial_balance: false,
        is_transfer: true,
        transfer_to_account_id: toAccountId,
        ai_suggested: false,
        user_corrected: false,
      })
      .select()
      .single();

    if (outgoingError) {
      return { success: false, error: outgoingError.message };
    }

    // Create incoming transaction (positive amount to destination account)
    const { data: incoming, error: incomingError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: toAccountId,
        date,
        name,
        amount: Math.abs(amount), // Positive for incoming
        subcategory_id: subcategoryId || null,
        comment,
        is_initial_balance: false,
        is_transfer: true,
        transfer_to_account_id: fromAccountId,
        ai_suggested: false,
        user_corrected: false,
      })
      .select()
      .single();

    if (incomingError) {
      // Rollback the outgoing transaction if incoming fails
      await supabase
        .from("transactions")
        .delete()
        .eq("id", outgoing.id);
      return { success: false, error: incomingError.message };
    }

    return { success: true, data: { outgoing, incoming } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== READ ==============

/**
 * Get all transactions for the current user (non-deleted) with optional filters
 */
export async function getTransactions(
  filters?: TransactionFilters
): Promise<TransactionsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.accountId) {
      query = query.eq("account_id", filters.accountId);
    }
    if (filters?.subcategoryId) {
      query = query.eq("subcategory_id", filters.subcategoryId);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters?.searchQuery) {
      query = query.ilike("name", `%${filters.searchQuery}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

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
 * Get transactions with full details (joined with accounts, categories, subcategories)
 */
export async function getTransactionsWithDetails(
  filters?: TransactionFilters
): Promise<TransactionsWithDetailsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // First get transactions
    let query = supabase
      .from("transactions")
      .select(`
        *,
        account:accounts!account_id(name, type),
        subcategory:subcategories!subcategory_id(name, category_id, category:categories!category_id(id, name, type)),
        transfer_account:accounts!transfer_to_account_id(name)
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.accountId) {
      query = query.eq("account_id", filters.accountId);
    }
    if (filters?.subcategoryId) {
      query = query.eq("subcategory_id", filters.subcategoryId);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters?.searchQuery) {
      query = query.ilike("name", `%${filters.searchQuery}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform data to flatten the joined relationships
    const transformedData: TransactionWithDetails[] = (data || []).map((txn) => {
      const account = txn.account as { name: string; type: string } | null;
      const subcategory = txn.subcategory as {
        name: string;
        category_id: string;
        category: { id: string; name: string; type: string } | null
      } | null;
      const transferAccount = txn.transfer_account as { name: string } | null;

      return {
        ...txn,
        account_name: account?.name,
        account_type: account?.type,
        subcategory_name: subcategory?.name,
        category_id: subcategory?.category?.id,
        category_name: subcategory?.category?.name,
        category_type: subcategory?.category?.type,
        transfer_to_account_name: transferAccount?.name,
        // Remove the nested objects
        account: undefined,
        subcategory: undefined,
        transfer_account: undefined,
      } as TransactionWithDetails;
    });

    return { success: true, data: transformedData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get transactions for a specific account
 */
export async function getTransactionsByAccount(
  accountId: string
): Promise<TransactionsResponse> {
  return getTransactions({ accountId });
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string): Promise<TransactionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
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
 * Get the most recent transaction for a given name and account (for lookup-based categorization)
 */
export async function getRecentTransactionByNameAndAccount(
  name: string,
  accountId: string
): Promise<TransactionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .eq("name", name)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get the most recent transaction for each account (for the Most Recent Activity panel)
 */
export async function getRecentActivityByAccount(): Promise<{
  success: boolean;
  data?: Array<{
    account_id: string;
    account_name: string;
    account_type: string;
    current_balance: number;
    recent_transaction: Transaction | null;
  }>;
  error?: string;
}> {
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
      .order("created_at", { ascending: true });

    if (accountsError) {
      return { success: false, error: accountsError.message };
    }

    if (!accounts || accounts.length === 0) {
      return { success: true, data: [] };
    }

    // For each account, get the current balance and most recent transaction
    const result = await Promise.all(
      accounts.map(async (account) => {
        // Calculate current balance
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .is("deleted_at", null);

        const transactionSum = (transactions || []).reduce(
          (sum, txn) => sum + txn.amount,
          0
        );
        const currentBalance = account.initial_balance + transactionSum;

        // Get most recent transaction
        const { data: recentTxn } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          account_id: account.id,
          account_name: account.name,
          account_type: account.type,
          current_balance: currentBalance,
          recent_transaction: recentTxn,
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== UPDATE ==============

/**
 * Update a transaction
 */
export async function updateTransaction(
  id: string,
  updates: UpdateTransactionData
): Promise<TransactionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
 * Bulk update subcategory for multiple transactions
 */
export async function bulkUpdateTransactions(
  ids: string[],
  updates: { subcategory_id?: string | null }
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("user_id", user.id)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== DELETE ==============

/**
 * Soft delete a single transaction
 */
export async function deleteTransaction(id: string): Promise<TransactionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
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
 * Bulk soft delete multiple transactions
 */
export async function bulkDeleteTransactions(
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", user.id)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== BALANCE CALCULATIONS ==============

/**
 * Calculate the running balance for an account at a specific date
 * Formula: initial_balance + SUM(all transactions up to and including the date)
 */
export async function calculateRunningBalance(
  accountId: string,
  upToDate: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the account's initial balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (accountError) {
      return { success: false, error: accountError.message };
    }

    // Get all transactions up to and including the date
    const { data: transactions, error: txnError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .lte("date", upToDate)
      .is("deleted_at", null);

    if (txnError) {
      return { success: false, error: txnError.message };
    }

    const transactionSum = (transactions || []).reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    return { success: true, balance: account.initial_balance + transactionSum };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Calculate current balance for an account (all transactions)
 */
export async function calculateCurrentBalance(
  accountId: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the account's initial balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (accountError) {
      return { success: false, error: accountError.message };
    }

    // Get all transactions
    const { data: transactions, error: txnError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .is("deleted_at", null);

    if (txnError) {
      return { success: false, error: txnError.message };
    }

    const transactionSum = (transactions || []).reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    return { success: true, balance: account.initial_balance + transactionSum };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get transactions with running balance calculated for each
 */
export async function getTransactionsWithRunningBalance(
  accountId: string,
  filters?: { startDate?: string; endDate?: string }
): Promise<{
  success: boolean;
  data?: Array<Transaction & { running_balance: number }>;
  error?: string;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get account initial balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (accountError) {
      return { success: false, error: accountError.message };
    }

    // Build query for transactions
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .is("deleted_at", null)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }

    const { data: transactions, error: txnError } = await query;

    if (txnError) {
      return { success: false, error: txnError.message };
    }

    // If we have a start date filter, we need to calculate the balance up to the start date
    let startingBalance = account.initial_balance;

    if (filters?.startDate) {
      // Get sum of all transactions before the start date
      const { data: priorTransactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("account_id", accountId)
        .lt("date", filters.startDate)
        .is("deleted_at", null);

      const priorSum = (priorTransactions || []).reduce(
        (sum, txn) => sum + txn.amount,
        0
      );
      startingBalance += priorSum;
    }

    // Calculate running balance for each transaction
    let runningBalance = startingBalance;
    const transactionsWithBalance = (transactions || []).map((txn) => {
      runningBalance += txn.amount;
      return {
        ...txn,
        running_balance: runningBalance,
      };
    });

    return { success: true, data: transactionsWithBalance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
