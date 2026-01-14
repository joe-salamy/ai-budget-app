// Vercel Serverless Function - Statement Parsing with Regex + Parallel Batch Categorization
// Parses bank/credit card statements, detects duplicates, and categorizes transactions

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ============== TYPES ==============

interface ParseStatementRequest {
  statementText: string;
  accountId: string;
  access_token: string;
}

interface ParsedTransaction {
  date: string;
  name: string;
  amount: number;
  needsReview: boolean;
  confidence: number;
  originalLine: string;
}

interface CategorizationResult {
  subcategory_id: string;
  subcategory_name: string;
  category_name: string;
  confidence: number;
}

interface EnrichedTransaction extends ParsedTransaction {
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_name: string | null;
  categorizationSource: "lookup" | "correction" | "ai" | "none";
  isDuplicate: boolean;
  aiConfidence: number;
}

interface ParseStatementResponse {
  success: boolean;
  transactions: EnrichedTransaction[];
  summary: {
    total: number;
    duplicates: number;
    fromLookup: number;
    fromCorrection: number;
    fromAI: number;
    uncategorized: number;
    needsReview: number;
  };
  format: string | null;
  parseSuccessRate: number;
  errors: string[];
}

// ============== STATEMENT PARSER (Embedded for Vercel) ==============

// Date parsing patterns
const DATE_PATTERNS = [
  {
    regex: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    parse: (m: RegExpMatchArray) => {
      const month = m[1].padStart(2, "0");
      const day = m[2].padStart(2, "0");
      let year = m[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    },
  },
  {
    regex: /^(\d{1,2})\/(\d{1,2})(?!\/)/,
    parse: (m: RegExpMatchArray) => {
      const month = m[1].padStart(2, "0");
      const day = m[2].padStart(2, "0");
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    },
  },
  {
    regex: /(\d{4})-(\d{2})-(\d{2})/,
    parse: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}`,
  },
  {
    regex: /(\d{2})-(\d{2})-(\d{4})/,
    parse: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}`,
  },
  {
    regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
    parse: (m: RegExpMatchArray) => {
      const monthMap: Record<string, string> = {
        jan: "01",
        feb: "02",
        mar: "03",
        apr: "04",
        may: "05",
        jun: "06",
        jul: "07",
        aug: "08",
        sep: "09",
        oct: "10",
        nov: "11",
        dec: "12",
      };
      const month = monthMap[m[1].toLowerCase().slice(0, 3)];
      const day = m[2].padStart(2, "0");
      return `${m[3]}-${month}-${day}`;
    },
  },
];

function parseDate(dateStr: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = dateStr.match(pattern.regex);
    if (match) {
      try {
        const parsed = pattern.parse(match);
        const date = new Date(parsed);
        if (!isNaN(date.getTime())) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function parseAmount(amountStr: string): { value: number; isDebit: boolean } | null {
  let cleaned = amountStr.trim();
  let isDebit = false;

  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    isDebit = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("-")) {
    isDebit = true;
    cleaned = cleaned.slice(1);
  }
  if (cleaned.endsWith("-")) {
    isDebit = true;
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.toUpperCase().endsWith("DR")) {
    isDebit = true;
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.toUpperCase().endsWith("CR")) {
    isDebit = false;
    cleaned = cleaned.slice(0, -2);
  }

  cleaned = cleaned.replace(/[$£€¥\s]/g, "");
  cleaned = cleaned.replace(/,/g, "");

  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) return null;

  return { value, isDebit };
}

function cleanTransactionName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/^(POS|ACH|CHECK|DEBIT|CREDIT|PURCHASE)\s+/i, "")
    .replace(/\s+#?\d{6,}$/, "")
    .replace(/[.,;:]+$/, "")
    .trim();
}

function isHeaderLine(line: string): boolean {
  const headerKeywords = [
    /^date/i,
    /^transaction/i,
    /^description/i,
    /^amount/i,
    /^balance/i,
    /^posting/i,
    /^reference/i,
    /^withdrawal/i,
    /^deposit/i,
    /^debit/i,
    /^credit/i,
    /^\s*#/,
  ];

  let headerCount = 0;
  for (const pattern of headerKeywords) {
    if (pattern.test(line.toLowerCase())) {
      headerCount++;
    }
  }
  return headerCount >= 2;
}

// Format patterns for detection and parsing
const FORMAT_PATTERNS = [
  {
    name: "credit_card_standard",
    regex: /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})\s*$/,
    extract: (match: RegExpMatchArray, line: string) => {
      const amountResult = parseAmount(match[3]);
      if (!amountResult) return null;
      return {
        date: match[1],
        name: match[2].trim(),
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },
  {
    name: "chase_credit",
    regex: /^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})?\s*(.+?)\s+(-?[\d,]+\.\d{2})\s*$/,
    extract: (match: RegExpMatchArray, line: string) => {
      const amountResult = parseAmount(match[4]);
      if (!amountResult) return null;
      return {
        date: match[1],
        name: match[3].trim(),
        amount: amountResult.value,
        isDebit: !amountResult.isDebit,
        originalLine: line,
      };
    },
  },
  {
    name: "simple_csv",
    regex: /^"?([^",]+)"?,\s*"?([^",]+)"?,\s*"?(-?[\d,$.]+)"?\s*$/,
    extract: (match: RegExpMatchArray, line: string) => {
      const amountResult = parseAmount(match[3]);
      if (!amountResult) return null;
      return {
        date: match[1].trim(),
        name: match[2].trim(),
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },
  {
    name: "tab_separated",
    regex: /^([^\t]+)\t([^\t]+)\t(-?[\d,$.]+)\s*$/,
    extract: (match: RegExpMatchArray, line: string) => {
      const amountResult = parseAmount(match[3]);
      if (!amountResult) return null;
      return {
        date: match[1].trim(),
        name: match[2].trim(),
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },
];

function parseStatementText(text: string): {
  transactions: ParsedTransaction[];
  format: string | null;
  successRate: number;
  errors: string[];
} {
  const lines = text.split("\n").filter((line) => line.trim());
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let detectedFormat: string | null = null;

  for (const line of lines) {
    if (isHeaderLine(line)) continue;

    let parsed = false;

    for (const format of FORMAT_PATTERNS) {
      const match = line.match(format.regex);
      if (match) {
        const raw = format.extract(match, line);
        if (raw) {
          const normalizedDate = parseDate(raw.date);
          if (normalizedDate) {
            const signedAmount = raw.isDebit ? -raw.amount : raw.amount;
            transactions.push({
              date: normalizedDate,
              name: cleanTransactionName(raw.name),
              amount: signedAmount,
              needsReview: false,
              confidence: 0.9,
              originalLine: line,
            });
            successCount++;
            parsed = true;
            if (!detectedFormat) detectedFormat = format.name;
            break;
          }
        }
      }
    }

    if (!parsed) {
      // Fallback parsing
      const fallback = tryFallbackParsing(line);
      if (fallback) {
        transactions.push({
          ...fallback,
          needsReview: true,
          confidence: 0.5,
          originalLine: line,
        });
        successCount++;
      } else if (looksLikeTransaction(line)) {
        errors.push(`Could not parse: ${line.substring(0, 60)}...`);
      }
    }
  }

  const successRate = lines.length > 0 ? successCount / lines.length : 0;
  return { transactions, format: detectedFormat, successRate, errors };
}

function looksLikeTransaction(line: string): boolean {
  if (line.trim().length < 10) return false;
  const hasDate = /\d{1,2}\/\d{1,2}/.test(line) || /\d{4}-\d{2}-\d{2}/.test(line);
  const hasAmount = /\$?[\d,]+\.\d{2}/.test(line);
  return hasDate && hasAmount;
}

function tryFallbackParsing(line: string): { date: string; name: string; amount: number } | null {
  let date: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern.regex);
    if (match) {
      date = pattern.parse(match);
      break;
    }
  }
  if (!date) return null;

  const amountMatches = line.match(/(-?\$?[\d,]+\.\d{2})/g);
  if (!amountMatches || amountMatches.length === 0) return null;

  const lastAmount = amountMatches[amountMatches.length - 1];
  const amountResult = parseAmount(lastAmount);
  if (!amountResult) return null;

  let name = line;
  for (const pattern of DATE_PATTERNS) {
    name = name.replace(pattern.regex, "");
  }
  name = name.replace(/(-?\$?[\d,]+\.\d{2})/g, "");
  name = cleanTransactionName(name);
  if (name.length < 2) return null;

  const signedAmount = amountResult.isDebit ? -amountResult.value : amountResult.value;
  return { date, name, amount: signedAmount };
}

// ============== GEMINI API ==============

async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini API");

  return text;
}

// ============== MAIN HANDLER ==============

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const body = req.body as ParseStatementRequest;

    if (!body.access_token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!body.statementText || !body.accountId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check statement size
    if (body.statementText.length > 500000) {
      return res.status(400).json({ error: "Statement text too large" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: userData, error: authError } = await supabase.auth.getUser(body.access_token);

    if (authError || !userData.user) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const userId = userData.user.id;

    // Verify account belongs to user
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("id", body.accountId)
      .eq("user_id", userId)
      .single();

    if (accountError || !accountData) {
      return res.status(400).json({ error: "Invalid account" });
    }

    const accountName = accountData.name;

    // Step 1: Parse statement with regex
    console.log("Step 1: Parsing statement...");
    const parseResult = parseStatementText(body.statementText);

    if (parseResult.successRate < 0.1 && parseResult.transactions.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Could not parse statement. Please check the format and try again.",
        errors: parseResult.errors,
      });
    }

    if (parseResult.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No transactions found in the statement text.",
      });
    }

    // Limit transactions per request
    if (parseResult.transactions.length > 500) {
      return res.status(400).json({
        error: `Too many transactions (${parseResult.transactions.length}). Maximum 500 per request.`,
      });
    }

    // Step 2: Check for duplicates
    console.log("Step 2: Checking for duplicates...");
    const { data: existingTransactions } = await supabase
      .from("transactions")
      .select("date, name, amount")
      .eq("user_id", userId)
      .eq("account_id", body.accountId)
      .is("deleted_at", null);

    const existingSet = new Set(
      (existingTransactions || []).map(
        (t) => `${t.date}|${t.name.toLowerCase().trim()}|${Math.abs(t.amount).toFixed(2)}`
      )
    );

    // Step 3: Fetch subcategories
    const { data: subcategoriesData } = await supabase
      .from("subcategories")
      .select(`id, name, category_id, categories!inner (name, type)`)
      .eq("user_id", userId)
      .is("deleted_at", null);

    const subcategories = (subcategoriesData || []).map((s) => {
      const cat = s.categories as unknown as { name: string; type: string };
      return {
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        category_name: cat.name,
        category_type: cat.type,
      };
    });

    // Step 4: Fetch AI corrections
    console.log("Step 4: Looking up user corrections...");
    const { data: correctionsData } = await supabase
      .from("ai_corrections")
      .select(
        `transaction_name, user_corrected_subcategory:subcategories!user_corrected_subcategory_id (id, name, categories!inner (name))`
      )
      .eq("user_id", userId)
      .eq("account_id", body.accountId);

    const correctionMap = new Map<string, { id: string; name: string; category: string }>();
    (correctionsData || []).forEach((c) => {
      const sub = c.user_corrected_subcategory as unknown as {
        id: string;
        name: string;
        categories: { name: string };
      };
      correctionMap.set(c.transaction_name.toLowerCase(), {
        id: sub.id,
        name: sub.name,
        category: sub.categories.name,
      });
    });

    // Step 5: Fetch past transactions for lookup
    console.log("Step 5: Looking up past transactions...");
    const { data: pastTransactions } = await supabase
      .from("transactions")
      .select(`name, subcategory_id, subcategories!inner (name, categories!inner (name))`)
      .eq("user_id", userId)
      .eq("account_id", body.accountId)
      .is("deleted_at", null)
      .not("subcategory_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    const lookupMap = new Map<string, { id: string; name: string; category: string }>();
    (pastTransactions || []).forEach((t) => {
      const normalizedName = t.name.toLowerCase().trim();
      if (!lookupMap.has(normalizedName)) {
        const sub = t.subcategories as unknown as {
          name: string;
          categories: { name: string };
        };
        lookupMap.set(normalizedName, {
          id: t.subcategory_id!,
          name: sub.name,
          category: sub.categories.name,
        });
      }
    });

    // Step 6: Enrich transactions with categorization
    console.log("Step 6: Enriching transactions...");
    const enrichedTransactions: EnrichedTransaction[] = [];
    const needsAI: { index: number; txn: ParsedTransaction }[] = [];

    let duplicateCount = 0;
    let lookupCount = 0;
    let correctionCount = 0;

    for (let i = 0; i < parseResult.transactions.length; i++) {
      const txn = parseResult.transactions[i];

      // Check for duplicate
      const key = `${txn.date}|${txn.name.toLowerCase().trim()}|${Math.abs(txn.amount).toFixed(2)}`;
      const isDuplicate = existingSet.has(key);
      if (isDuplicate) duplicateCount++;

      const normalizedName = txn.name.toLowerCase().trim();

      // Try correction first
      const correction = correctionMap.get(normalizedName);
      if (correction) {
        enrichedTransactions.push({
          ...txn,
          subcategory_id: correction.id,
          subcategory_name: correction.name,
          category_name: correction.category,
          categorizationSource: "correction",
          isDuplicate,
          aiConfidence: 1.0,
        });
        correctionCount++;
        continue;
      }

      // Try lookup
      const lookup = lookupMap.get(normalizedName);
      if (lookup) {
        enrichedTransactions.push({
          ...txn,
          subcategory_id: lookup.id,
          subcategory_name: lookup.name,
          category_name: lookup.category,
          categorizationSource: "lookup",
          isDuplicate,
          aiConfidence: 0.95,
        });
        lookupCount++;
        continue;
      }

      // Needs AI
      needsAI.push({ index: enrichedTransactions.length, txn });
      enrichedTransactions.push({
        ...txn,
        subcategory_id: null,
        subcategory_name: null,
        category_name: null,
        categorizationSource: "none",
        isDuplicate,
        aiConfidence: 0,
      });
    }

    // Step 7: Parallel AI categorization
    let aiCount = 0;
    if (needsAI.length > 0 && geminiApiKey) {
      console.log(`Step 7: AI categorizing ${needsAI.length} transactions...`);

      const BATCH_SIZE = 10;
      const batches: { index: number; txn: ParsedTransaction }[][] = [];

      for (let i = 0; i < needsAI.length; i += BATCH_SIZE) {
        batches.push(needsAI.slice(i, i + BATCH_SIZE));
      }

      // Build subcategory list for prompt
      const incomeSubcats = subcategories.filter((s) => s.category_type === "income");
      const expenseSubcats = subcategories.filter((s) => s.category_type === "expense");

      let categoriesSection = "## AVAILABLE SUBCATEGORIES\n\n### INCOME:\n";
      incomeSubcats.forEach((s) => {
        categoriesSection += `- "${s.category_name} > ${s.name}" (id: ${s.id})\n`;
      });
      categoriesSection += "\n### EXPENSE:\n";
      expenseSubcats.forEach((s) => {
        categoriesSection += `- "${s.category_name} > ${s.name}" (id: ${s.id})\n`;
      });

      // Process batches in parallel
      const batchPromises = batches.map(async (batch) => {
        let txnSection = "## TRANSACTIONS TO CATEGORIZE\n\n";
        batch.forEach(({ txn }, i) => {
          const type = txn.amount >= 0 ? "income" : "expense";
          txnSection += `${i + 1}. Name: "${txn.name}", Account: "${accountName}", Amount: $${Math.abs(txn.amount).toFixed(2)} (${type})\n`;
        });

        const prompt = `You are a financial transaction categorization assistant. Categorize these transactions.

${categoriesSection}

${txnSection}

## INSTRUCTIONS
1. Select the BEST matching subcategory for each transaction
2. For income (positive amounts), use income subcategories
3. For expenses (negative amounts), use expense subcategories
4. If unsure, use "Unassigned"

## RESPONSE FORMAT
Return a JSON array with one object per transaction:
[{"subcategory_id": "uuid", "subcategory_name": "Name", "category_name": "Category", "confidence": 0.8}]

Respond ONLY with the JSON array.`;

        try {
          const response = await callGeminiAPI(prompt, geminiApiKey);
          const results: CategorizationResult[] = JSON.parse(response);
          return { batch, results };
        } catch (error) {
          console.error("AI batch error:", error);
          return { batch, results: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Apply results
      for (const { batch, results } of batchResults) {
        if (results && results.length === batch.length) {
          for (let i = 0; i < batch.length; i++) {
            const { index } = batch[i];
            const result = results[i];

            // Validate subcategory exists
            const validSubcat = subcategories.find((s) => s.id === result.subcategory_id);

            if (validSubcat) {
              enrichedTransactions[index] = {
                ...enrichedTransactions[index],
                subcategory_id: result.subcategory_id,
                subcategory_name: result.subcategory_name,
                category_name: result.category_name,
                categorizationSource: "ai",
                aiConfidence: result.confidence,
              };
              aiCount++;
            }
          }
        }
      }
    }

    const uncategorizedCount = enrichedTransactions.filter((t) => !t.subcategory_id).length;
    const needsReviewCount = enrichedTransactions.filter((t) => t.needsReview).length;

    const elapsedTime = Date.now() - startTime;
    console.log(`Statement parsing completed in ${elapsedTime}ms`);

    const response: ParseStatementResponse = {
      success: true,
      transactions: enrichedTransactions,
      summary: {
        total: enrichedTransactions.length,
        duplicates: duplicateCount,
        fromLookup: lookupCount,
        fromCorrection: correctionCount,
        fromAI: aiCount,
        uncategorized: uncategorizedCount,
        needsReview: needsReviewCount,
      },
      format: parseResult.format,
      parseSuccessRate: parseResult.successRate,
      errors: parseResult.errors,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Statement parsing error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
