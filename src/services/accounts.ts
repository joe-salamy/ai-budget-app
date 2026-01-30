// Account service - CRUD operations for accounts
import { supabase } from "../lib/supabaseClient";
import type { Account, AccountType } from "../types";

export interface CreateAccountData {
  name: string;
  type: AccountType;
  initial_balance: number;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
}

export interface AccountResponse {
  success: boolean;
  data?: Account;
  error?: string;
}

export interface AccountsResponse {
  success: boolean;
  data?: Account[];
  error?: string;
}

/**
 * Create a new account
 */
export async function createAccount(accountData: CreateAccountData): Promise<AccountResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check for name uniqueness (across accounts, categories, and subcategories)
    const { data: existingAccounts } = await supabase
      .from("accounts")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", accountData.name)
      .is("deleted_at", null);

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", accountData.name)
      .is("deleted_at", null);

    const { data: existingSubcategories } = await supabase
      .from("subcategories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", accountData.name)
      .is("deleted_at", null);

    if (
      (existingAccounts && existingAccounts.length > 0) ||
      (existingCategories && existingCategories.length > 0) ||
      (existingSubcategories && existingSubcategories.length > 0)
    ) {
      return {
        success: false,
        error: "An account, category, or subcategory with this name already exists",
      };
    }

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name: accountData.name,
        type: accountData.type,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Create an initial balance transaction if initial_balance is not zero
    if (accountData.initial_balance !== 0) {
      const { error: txnError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: data.id,
        date: data.created_at.split("T")[0], // Use account creation date
        name: `${accountData.name} - Initial Balance`,
        amount: accountData.initial_balance,
        subcategory_id: null,
        comment: null,
        is_initial_balance: true,
        is_transfer: false,
        transfer_to_account_id: null,
        ai_suggested: false,
        user_corrected: false,
      });

      if (txnError) {
        console.error("Failed to create initial balance transaction:", txnError);
      }
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
 * Get all accounts for the current user (non-deleted)
 */
export async function getAccounts(): Promise<AccountsResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

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

export interface AccountWithBalance extends Account {
  current_balance: number;
}

export interface AccountsWithBalanceResponse {
  success: boolean;
  data?: AccountWithBalance[];
  error?: string;
}

/**
 * Get all accounts with their current balances (initial_balance + transaction sum)
 */
export async function getAccountsWithBalances(): Promise<AccountsWithBalanceResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!accounts || accounts.length === 0) {
      return { success: true, data: [] };
    }

    // Calculate current balance for each account
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("account_id", account.id)
          .is("deleted_at", null);

        // Sum all transactions (including initial balance)
        const currentBalance = (transactions || []).reduce((sum, txn) => sum + txn.amount, 0);

        return {
          ...account,
          current_balance: currentBalance,
        };
      })
    );

    return { success: true, data: accountsWithBalances };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a single account by ID
 */
export async function getAccountById(id: string): Promise<AccountResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("accounts")
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
 * Update an account
 * Note: Renaming to an existing name will return an error (merge behavior handled in UI)
 */
export async function updateAccount(
  id: string,
  updates: UpdateAccountData
): Promise<AccountResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // If updating name, check for uniqueness
    if (updates.name) {
      const { data: existingAccounts } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null)
        .neq("id", id);

      const { data: existingCategories } = await supabase
        .from("categories")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      const { data: existingSubcategories } = await supabase
        .from("subcategories")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      if (
        (existingAccounts && existingAccounts.length > 0) ||
        (existingCategories && existingCategories.length > 0) ||
        (existingSubcategories && existingSubcategories.length > 0)
      ) {
        return {
          success: false,
          error: "An account, category, or subcategory with this name already exists",
        };
      }
    }

    const { data, error } = await supabase
      .from("accounts")
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
 * Soft delete an account
 */
export async function deleteAccount(id: string): Promise<AccountResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("accounts")
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
 * Delete all transactions associated with an account (soft delete)
 */
export async function deleteAccountTransactions(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("account_id", accountId)
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
 * Get count of transactions for an account
 */
export async function getAccountTransactionCount(
  accountId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { count, error } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
