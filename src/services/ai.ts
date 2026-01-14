// AI service - Client-side interface for AI categorization
import { supabase } from "../lib/supabaseClient";

// ============== TYPES ==============

export interface TransactionForCategorization {
  name: string;
  account_name: string;
  amount: number;
}

export interface CategorizationResult {
  subcategory_id: string;
  subcategory_name: string;
  category_name: string;
  confidence: number;
}

export interface CategorizationResponse {
  success: boolean;
  data?: CategorizationResult;
  error?: string;
}

export interface BatchCategorizationResponse {
  success: boolean;
  data?: CategorizationResult[];
  error?: string;
}

// ============== AI CORRECTION TYPES ==============

export interface SaveAICorrectionData {
  transaction_name: string;
  account_id: string;
  ai_suggested_subcategory_id: string | null;
  user_corrected_subcategory_id: string;
}

export interface AICorrectionResponse {
  success: boolean;
  error?: string;
}

// ============== CATEGORIZATION ==============

/**
 * Categorize a single transaction using AI
 */
export async function categorizeSingleTransaction(
  transaction: TransactionForCategorization
): Promise<CategorizationResponse> {
  try {
    // Get the current session for the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "User not authenticated" };
    }

    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "single",
        transaction,
        access_token: session.access_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data: CategorizationResult = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("AI categorization error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Categorize multiple transactions using AI (batch mode)
 */
export async function categorizeBatchTransactions(
  transactions: TransactionForCategorization[]
): Promise<BatchCategorizationResponse> {
  try {
    if (transactions.length === 0) {
      return { success: true, data: [] };
    }

    // Get the current session for the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "User not authenticated" };
    }

    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "batch",
        transactions,
        access_token: session.access_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data: CategorizationResult[] = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("AI batch categorization error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== AI CORRECTIONS ==============

/**
 * Save a user's correction to an AI suggestion
 * This helps improve future categorizations for similar transactions
 */
export async function saveAICorrection(data: SaveAICorrectionData): Promise<AICorrectionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Normalize the transaction name for better matching
    const normalizedName = data.transaction_name.trim().toLowerCase();

    // Check if there's already a correction for this transaction name + account
    const { data: existing } = await supabase
      .from("ai_corrections")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_name", normalizedName)
      .eq("account_id", data.account_id)
      .maybeSingle();

    if (existing) {
      // Update existing correction
      const { error } = await supabase
        .from("ai_corrections")
        .update({
          ai_suggested_subcategory_id: data.ai_suggested_subcategory_id,
          user_corrected_subcategory_id: data.user_corrected_subcategory_id,
        })
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new correction
      const { error } = await supabase.from("ai_corrections").insert({
        user_id: user.id,
        transaction_name: normalizedName,
        account_id: data.account_id,
        ai_suggested_subcategory_id: data.ai_suggested_subcategory_id,
        user_corrected_subcategory_id: data.user_corrected_subcategory_id,
      });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving AI correction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get AI correction for a specific transaction name and account
 * Returns the user's preferred categorization if one exists
 */
export async function getAICorrection(
  transactionName: string,
  accountId: string
): Promise<{ success: boolean; data?: { subcategory_id: string }; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const normalizedName = transactionName.trim().toLowerCase();

    const { data, error } = await supabase
      .from("ai_corrections")
      .select("user_corrected_subcategory_id")
      .eq("user_id", user.id)
      .eq("transaction_name", normalizedName)
      .eq("account_id", accountId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      return {
        success: true,
        data: { subcategory_id: data.user_corrected_subcategory_id },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error getting AI correction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
