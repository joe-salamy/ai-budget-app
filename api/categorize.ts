// Vercel Serverless Function - AI Transaction Categorization
// Uses Google Gemini 2.5 Flash for intelligent categorization

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ============== TYPES ==============

interface TransactionInput {
  name: string;
  account_name: string;
  amount: number;
}

interface SingleModeRequest {
  mode: "single";
  transaction: TransactionInput;
  access_token: string;
}

interface BatchModeRequest {
  mode: "batch";
  transactions: TransactionInput[];
  access_token: string;
}

type CategorizeRequest = SingleModeRequest | BatchModeRequest;

interface SubcategoryWithCategory {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  category_type: "income" | "expense";
}

interface PastTransaction {
  name: string;
  account_name: string;
  subcategory_name: string;
  category_name: string;
}

interface AICorrection {
  transaction_name: string;
  account_name: string;
  corrected_subcategory: string;
  corrected_category: string;
}

interface CategorizationResult {
  subcategory_id: string;
  subcategory_name: string;
  category_name: string;
  confidence: number;
}

// ============== GEMINI API ==============

async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent categorization
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
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

  // Extract the text from the response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini API");
  }

  // Log token usage for cost monitoring
  const usageMetadata = data.usageMetadata;
  if (usageMetadata) {
    console.log("Gemini API usage:", {
      promptTokens: usageMetadata.promptTokenCount,
      responseTokens: usageMetadata.candidatesTokenCount,
      totalTokens: usageMetadata.totalTokenCount,
    });
  }

  return text;
}

// ============== PROMPT BUILDING ==============

function buildCategorizationPrompt(
  transactions: TransactionInput[],
  subcategories: SubcategoryWithCategory[],
  pastTransactions: PastTransaction[],
  corrections: AICorrection[]
): string {
  // Group subcategories by category for clearer prompt
  const incomeSubcategories = subcategories.filter((s) => s.category_type === "income");
  const expenseSubcategories = subcategories.filter((s) => s.category_type === "expense");

  // Build the available categories section
  let categoriesSection = "## AVAILABLE SUBCATEGORIES\n\n";

  categoriesSection += "### INCOME SUBCATEGORIES:\n";
  incomeSubcategories.forEach((s) => {
    categoriesSection += `- "${s.category_name} > ${s.name}" (id: ${s.id})\n`;
  });

  categoriesSection += "\n### EXPENSE SUBCATEGORIES:\n";
  expenseSubcategories.forEach((s) => {
    categoriesSection += `- "${s.category_name} > ${s.name}" (id: ${s.id})\n`;
  });

  // Build past transactions section (for context)
  let pastSection = "";
  if (pastTransactions.length > 0) {
    pastSection = "\n## PAST CATEGORIZATION EXAMPLES\n";
    pastSection += "Here are examples of how this user has categorized similar transactions:\n\n";
    pastTransactions.slice(0, 50).forEach((t) => {
      pastSection += `- "${t.name}" (${t.account_name}) → ${t.category_name} > ${t.subcategory_name}\n`;
    });
  }

  // Build corrections section (user preferences)
  let correctionsSection = "";
  if (corrections.length > 0) {
    correctionsSection = "\n## USER CORRECTIONS (IMPORTANT - Follow these patterns)\n";
    correctionsSection +=
      "The user has corrected these categorizations before. ALWAYS follow these patterns:\n\n";
    corrections.forEach((c) => {
      correctionsSection += `- "${c.transaction_name}" (${c.account_name}) → MUST BE: ${c.corrected_category} > ${c.corrected_subcategory}\n`;
    });
  }

  // Build transactions to categorize
  let transactionsSection = "\n## TRANSACTIONS TO CATEGORIZE\n\n";
  transactions.forEach((t, i) => {
    const amountType = t.amount >= 0 ? "income" : "expense";
    transactionsSection += `${i + 1}. Name: "${t.name}", Account: "${t.account_name}", Amount: $${Math.abs(t.amount).toFixed(2)} (${amountType})\n`;
  });

  const prompt = `You are a financial transaction categorization assistant. Your task is to categorize transactions into the most appropriate subcategory based on the transaction name, account, and amount sign.

${categoriesSection}
${pastSection}
${correctionsSection}
${transactionsSection}

## INSTRUCTIONS

1. For each transaction, select the BEST matching subcategory from the available options
2. The transaction amount's SIGN indicates the direction:
   - Positive amounts (+) are income/deposits → suggest income category subcategories
   - Negative amounts (-) are expenses/withdrawals → suggest expense category subcategories
3. If a similar transaction appears in the past examples, use the same categorization
4. If the user has corrected a similar transaction, ALWAYS follow that correction
5. If no good match exists, use "Unassigned" subcategory for the appropriate type (income or expense)
6. For income transactions (positive amounts), ONLY use income subcategories
7. For expense transactions (negative amounts), ONLY use expense subcategories

## RESPONSE FORMAT

Return a JSON array with one object per transaction, in the same order as the input:

[
  {
    "subcategory_id": "uuid-here",
    "subcategory_name": "Subcategory Name",
    "category_name": "Category Name",
    "confidence": 0.95
  }
]

The confidence should be:
- 1.0 if matching a user correction exactly
- 0.9+ if matching a past transaction closely
- 0.7-0.9 for reasonable matches based on transaction name
- 0.5-0.7 for less certain matches
- 0.3-0.5 for guesses (consider using Unassigned instead)

Respond ONLY with the JSON array, no additional text.`;

  return prompt;
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
    const body = req.body as CategorizeRequest;

    if (!body.access_token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Create Supabase client with user's access token for RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token and get user ID
    const { data: userData, error: authError } = await supabase.auth.getUser(body.access_token);

    if (authError || !userData.user) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const userId = userData.user.id;

    // Get transactions to categorize
    const transactions: TransactionInput[] =
      body.mode === "single" ? [body.transaction] : body.transactions;

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: "No transactions to categorize" });
    }

    // Rate limiting check (simple per-request limit)
    if (transactions.length > 50) {
      return res.status(400).json({
        error: "Too many transactions. Maximum 50 per request.",
      });
    }

    // Fetch user's subcategories with category info
    const { data: subcategoriesData, error: subcatError } = await supabase
      .from("subcategories")
      .select(
        `
        id,
        name,
        category_id,
        categories!inner (
          name,
          type
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (subcatError) {
      console.error("Error fetching subcategories:", subcatError);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }

    const subcategories: SubcategoryWithCategory[] = (subcategoriesData || []).map((s) => {
      const cat = s.categories as unknown as { name: string; type: "income" | "expense" };
      return {
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        category_name: cat.name,
        category_type: cat.type,
      };
    });

    // Fetch sample of past transactions (last 100)
    const { data: pastTransactionsData } = await supabase
      .from("transactions")
      .select(
        `
        name,
        accounts!inner (name),
        subcategories!inner (
          name,
          categories!inner (name)
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .not("subcategory_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    const pastTransactions: PastTransaction[] = (pastTransactionsData || []).map((t) => {
      const acc = t.accounts as unknown as { name: string };
      const subcat = t.subcategories as unknown as { name: string; categories: { name: string } };
      return {
        name: t.name,
        account_name: acc.name,
        subcategory_name: subcat.name,
        category_name: subcat.categories.name,
      };
    });

    // Fetch user's AI corrections
    const { data: correctionsData } = await supabase
      .from("ai_corrections")
      .select(
        `
        transaction_name,
        accounts!inner (name),
        user_corrected_subcategory:subcategories!user_corrected_subcategory_id (
          name,
          categories!inner (name)
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const corrections: AICorrection[] = (correctionsData || []).map((c) => {
      const acc = c.accounts as unknown as { name: string };
      const subcat = c.user_corrected_subcategory as unknown as {
        name: string;
        categories: { name: string };
      };
      return {
        transaction_name: c.transaction_name,
        account_name: acc.name,
        corrected_subcategory: subcat.name,
        corrected_category: subcat.categories.name,
      };
    });

    // Build prompt and call Gemini
    const prompt = buildCategorizationPrompt(
      transactions,
      subcategories,
      pastTransactions,
      corrections
    );

    let results: CategorizationResult[];

    try {
      const geminiResponse = await callGeminiAPI(prompt, geminiApiKey);

      // Parse JSON response
      results = JSON.parse(geminiResponse);

      // Validate response structure
      if (!Array.isArray(results) || results.length !== transactions.length) {
        throw new Error("Invalid response structure from AI");
      }

      // Validate each result has required fields
      results = results.map((r, i) => {
        // Find the subcategory to validate it exists
        const subcategory = subcategories.find((s) => s.id === r.subcategory_id);

        if (!subcategory) {
          // If AI returned invalid subcategory, use Unassigned
          const transactionAmount = transactions[i].amount;
          const type = transactionAmount >= 0 ? "income" : "expense";
          const unassigned = subcategories.find(
            (s) => s.name === "Unassigned" && s.category_type === type
          );

          if (unassigned) {
            return {
              subcategory_id: unassigned.id,
              subcategory_name: unassigned.name,
              category_name: unassigned.category_name,
              confidence: 0.3,
            };
          }
        }

        return {
          subcategory_id: r.subcategory_id,
          subcategory_name: r.subcategory_name || subcategory?.name || "Unknown",
          category_name: r.category_name || subcategory?.category_name || "Unknown",
          confidence: r.confidence || 0.5,
        };
      });
    } catch (aiError) {
      console.error("AI categorization error:", aiError);

      // Fallback: return Unassigned for all transactions
      results = transactions.map((t) => {
        const type = t.amount >= 0 ? "income" : "expense";
        const unassigned = subcategories.find(
          (s) => s.name === "Unassigned" && s.category_type === type
        );

        return {
          subcategory_id: unassigned?.id || "",
          subcategory_name: "Unassigned",
          category_name: "Unassigned",
          confidence: 0,
        };
      });
    }

    // Return results based on mode
    if (body.mode === "single") {
      return res.status(200).json(results[0]);
    } else {
      return res.status(200).json(results);
    }
  } catch (error) {
    console.error("Categorization error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
