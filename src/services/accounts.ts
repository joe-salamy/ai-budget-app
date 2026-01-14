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
  initial_balance?: number;
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
        initial_balance: accountData.initial_balance,
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
