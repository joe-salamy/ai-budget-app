// Statement service - Client-side interface for statement parsing
import { supabase } from "../lib/supabaseClient";

// ============== TYPES ==============

export interface ParsedTransaction {
  date: string;
  name: string;
  amount: number;
  needsReview: boolean;
  confidence: number;
  originalLine: string;
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_name: string | null;
  categorizationSource: "lookup" | "correction" | "ai" | "none";
  isDuplicate: boolean;
  aiConfidence: number;
}

export interface ParseStatementSummary {
  total: number;
  duplicates: number;
  fromLookup: number;
  fromCorrection: number;
  fromAI: number;
  uncategorized: number;
  needsReview: number;
}

export interface ParseStatementResponse {
  success: boolean;
  transactions?: ParsedTransaction[];
  summary?: ParseStatementSummary;
  format?: string | null;
  parseSuccessRate?: number;
  errors?: string[];
  error?: string;
}

// ============== API CALLS ==============

/**
 * Parse a statement and categorize transactions
 */
export async function parseStatement(
  statementText: string,
  accountId: string
): Promise<ParseStatementResponse> {
  try {
    // Get the current session for the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "User not authenticated" };
    }

    const response = await fetch("/api/parse-statement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statementText,
        accountId,
        access_token: session.access_token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `API error: ${response.status}`,
        errors: data.errors,
      };
    }

    return {
      success: true,
      transactions: data.transactions,
      summary: data.summary,
      format: data.format,
      parseSuccessRate: data.parseSuccessRate,
      errors: data.errors,
    };
  } catch (error) {
    console.error("Statement parsing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Quick validation of statement text format
 * Returns true if the text looks like it might contain transactions
 */
export function validateStatementFormat(text: string): {
  valid: boolean;
  lineCount: number;
  hasDatePattern: boolean;
  hasAmountPattern: boolean;
  message?: string;
} {
  const lines = text.split("\n").filter((line) => line.trim());
  const lineCount = lines.length;

  // Check for date patterns
  const datePatterns = [/\d{1,2}\/\d{1,2}/, /\d{4}-\d{2}-\d{2}/, /\d{2}-\d{2}-\d{4}/];
  const hasDatePattern = lines.some((line) => datePatterns.some((pattern) => pattern.test(line)));

  // Check for amount patterns
  const hasAmountPattern = lines.some((line) => /\$?[\d,]+\.\d{2}/.test(line));

  let valid = true;
  let message: string | undefined;

  if (lineCount === 0) {
    valid = false;
    message = "No text provided";
  } else if (!hasDatePattern) {
    valid = false;
    message = "No date patterns found. Expected formats: MM/DD, MM/DD/YYYY, YYYY-MM-DD";
  } else if (!hasAmountPattern) {
    valid = false;
    message = "No amount patterns found. Expected format: $123.45 or 123.45";
  } else if (lineCount < 2) {
    message = "Only one line found. Make sure to paste the full statement.";
  }

  return { valid, lineCount, hasDatePattern, hasAmountPattern, message };
}

/**
 * Save multiple transactions from statement parsing
 */
export async function saveStatementTransactions(
  transactions: Array<{
    account_id: string;
    date: string;
    name: string;
    amount: number;
    subcategory_id: string | null;
    comment?: string | null;
    ai_suggested: boolean;
    user_corrected: boolean;
  }>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, count: 0, error: "User not authenticated" };
    }

    // Prepare transactions for insert
    const transactionsToInsert = transactions.map((txn) => ({
      user_id: user.id,
      account_id: txn.account_id,
      date: txn.date,
      name: txn.name,
      amount: txn.amount,
      subcategory_id: txn.subcategory_id,
      comment: txn.comment || null,
      is_initial_balance: false,
      is_transfer: false,
      ai_suggested: txn.ai_suggested,
      user_corrected: txn.user_corrected,
    }));

    // Insert in batches to avoid timeout
    const BATCH_SIZE = 50;
    let insertedCount = 0;

    for (let i = 0; i < transactionsToInsert.length; i += BATCH_SIZE) {
      const batch = transactionsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("transactions").insert(batch);

      if (error) {
        console.error("Error inserting batch:", error);
        return {
          success: false,
          count: insertedCount,
          error: `Failed to save transactions: ${error.message}`,
        };
      }

      insertedCount += batch.length;
    }

    return { success: true, count: insertedCount };
  } catch (error) {
    console.error("Error saving statement transactions:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
