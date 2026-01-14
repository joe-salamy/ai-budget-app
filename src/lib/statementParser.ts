// Statement Parser - Regex-based parsing utilities for bank/credit card statements
// Supports multiple date formats, amount formats, and statement layouts

// ============== TYPES ==============

export interface RawTransaction {
  date: string; // Original date string from statement
  name: string; // Transaction description
  amount: number; // Absolute amount value
  isDebit: boolean; // true = expense/withdrawal, false = credit/deposit
  originalLine: string; // Original text for debugging
}

export interface ParsedTransaction {
  date: string; // Normalized to YYYY-MM-DD
  name: string; // Cleaned transaction description
  amount: number; // Positive = income, negative = expense
  needsReview: boolean; // True if parsing was uncertain
  confidence: number; // 0-1 confidence score
  originalLine: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  format: StatementFormat | null;
  successRate: number; // Percentage of lines successfully parsed
  errors: string[];
}

export type StatementFormat =
  | "credit_card_standard" // MM/DD Date Description Amount
  | "bank_standard" // Date Description Withdrawal Deposit Balance
  | "simple_csv" // Date, Description, Amount
  | "tab_separated" // Tab-separated values
  | "chase_credit" // Chase credit card format
  | "amex" // American Express format
  | "capital_one" // Capital One format
  | "wells_fargo" // Wells Fargo format
  | "unknown";

// ============== DATE PARSING ==============

// Common date format patterns
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM/DD/YY
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
  // MM/DD (no year - assume current year)
  {
    regex: /^(\d{1,2})\/(\d{1,2})(?!\/)/, // Negative lookahead to avoid matching MM/DD/YYYY
    parse: (m: RegExpMatchArray) => {
      const month = m[1].padStart(2, "0");
      const day = m[2].padStart(2, "0");
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    },
  },
  // YYYY-MM-DD
  {
    regex: /(\d{4})-(\d{2})-(\d{2})/,
    parse: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}`,
  },
  // DD-MM-YYYY
  {
    regex: /(\d{2})-(\d{2})-(\d{4})/,
    parse: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}`,
  },
  // Month DD, YYYY (e.g., "Jan 15, 2024")
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

/**
 * Parse a date string and return normalized YYYY-MM-DD format
 */
export function parseDate(dateStr: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = dateStr.match(pattern.regex);
    if (match) {
      try {
        const parsed = pattern.parse(match);
        // Validate the date
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

// ============== AMOUNT PARSING ==============

/**
 * Parse an amount string and return { value: number, isDebit: boolean }
 * Handles various formats: $1,234.56, -$45.99, ($99.99), 123.45, etc.
 */
export function parseAmount(amountStr: string): {
  value: number;
  isDebit: boolean;
} | null {
  // Clean the string
  let cleaned = amountStr.trim();

  // Check for debit indicators
  let isDebit = false;

  // Parentheses indicate negative (common in accounting)
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    isDebit = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Leading minus sign
  if (cleaned.startsWith("-")) {
    isDebit = true;
    cleaned = cleaned.slice(1);
  }

  // Trailing minus sign (some formats)
  if (cleaned.endsWith("-")) {
    isDebit = true;
    cleaned = cleaned.slice(0, -1);
  }

  // "DR" or "CR" suffix
  if (cleaned.toUpperCase().endsWith("DR")) {
    isDebit = true;
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.toUpperCase().endsWith("CR")) {
    isDebit = false;
    cleaned = cleaned.slice(0, -2);
  }

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[$£€¥\s]/g, "");

  // Remove thousand separators (commas)
  cleaned = cleaned.replace(/,/g, "");

  // Parse the number
  const value = parseFloat(cleaned);

  if (isNaN(value) || value < 0) {
    return null;
  }

  return { value, isDebit };
}

// ============== LINE PARSING ==============

// Statement format detection patterns
const FORMAT_PATTERNS: Record<
  StatementFormat,
  {
    lineRegex: RegExp;
    extract: (match: RegExpMatchArray, line: string) => RawTransaction | null;
    headerPatterns?: RegExp[];
  }
> = {
  // Standard credit card: Date Description Amount
  credit_card_standard: {
    lineRegex: /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})\s*$/,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[2].trim();
      const amountResult = parseAmount(match[3]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
    headerPatterns: [/date.*description.*amount/i, /transaction.*date/i],
  },

  // Bank statement with separate withdrawal/deposit columns
  bank_standard: {
    lineRegex:
      /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?[\d,]+\.\d{2})?\s+(-?[\d,]+\.\d{2})?\s+(-?[\d,]+\.\d{2})\s*$/,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[2].trim();
      const withdrawal = match[3] ? parseAmount(match[3])?.value : undefined;
      const deposit = match[4] ? parseAmount(match[4])?.value : undefined;

      // Use withdrawal if present, otherwise deposit
      const amount = withdrawal ?? deposit;
      if (amount === undefined) return null;

      return {
        date: dateStr,
        name,
        amount,
        isDebit: withdrawal !== undefined,
        originalLine: line,
      };
    },
    headerPatterns: [/date.*description.*withdrawal.*deposit.*balance/i],
  },

  // Simple CSV: Date, Description, Amount
  simple_csv: {
    lineRegex: /^"?([^",]+)"?,\s*"?([^",]+)"?,\s*"?(-?[\d,$.]+)"?\s*$/,
    extract: (match, line) => {
      const dateStr = match[1].trim();
      const name = match[2].trim();
      const amountResult = parseAmount(match[3]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },

  // Tab-separated values
  tab_separated: {
    lineRegex: /^([^\t]+)\t([^\t]+)\t(-?[\d,$.]+)\s*$/,
    extract: (match, line) => {
      const dateStr = match[1].trim();
      const name = match[2].trim();
      const amountResult = parseAmount(match[3]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },

  // Chase credit card format
  chase_credit: {
    lineRegex: /^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})?\s*(.+?)\s+(-?[\d,]+\.\d{2})\s*$/,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[3].trim();
      const amountResult = parseAmount(match[4]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: !amountResult.isDebit, // Chase shows negative for credits
        originalLine: line,
      };
    },
    headerPatterns: [/trans.*date.*post.*date.*description.*amount/i],
  },

  // American Express format
  amex: {
    lineRegex: /^(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\$?[\d,]+\.\d{2})\s*$/,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[2].trim();
      const amountResult = parseAmount(match[3]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: true, // Amex shows all as charges unless marked
        originalLine: line,
      };
    },
  },

  // Capital One format
  capital_one: {
    lineRegex: /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(Debit|Credit)\s+(-?[\d,]+\.\d{2})\s*$/i,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[2].trim();
      const isDebit = match[3].toLowerCase() === "debit";
      const amountResult = parseAmount(match[4]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit,
        originalLine: line,
      };
    },
  },

  // Wells Fargo format
  wells_fargo: {
    lineRegex: /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?[\d,]+\.\d{2})\s*$/,
    extract: (match, line) => {
      const dateStr = match[1];
      const name = match[2].trim();
      const amountResult = parseAmount(match[3]);

      if (!amountResult) return null;

      return {
        date: dateStr,
        name,
        amount: amountResult.value,
        isDebit: amountResult.isDebit,
        originalLine: line,
      };
    },
  },

  // Fallback unknown format
  unknown: {
    lineRegex: /.*/,
    extract: () => null,
  },
};

// ============== FORMAT DETECTION ==============

/**
 * Detect the statement format by trying each pattern
 */
export function detectFormat(text: string): StatementFormat {
  const lines = text.split("\n").filter((line) => line.trim());

  // Count successful parses for each format
  const formatScores: Record<StatementFormat, number> = {
    credit_card_standard: 0,
    bank_standard: 0,
    simple_csv: 0,
    tab_separated: 0,
    chase_credit: 0,
    amex: 0,
    capital_one: 0,
    wells_fargo: 0,
    unknown: 0,
  };

  // Check header patterns first
  for (const line of lines.slice(0, 5)) {
    for (const [format, pattern] of Object.entries(FORMAT_PATTERNS)) {
      if (pattern.headerPatterns) {
        for (const headerPattern of pattern.headerPatterns) {
          if (headerPattern.test(line)) {
            formatScores[format as StatementFormat] += 5;
          }
        }
      }
    }
  }

  // Try parsing lines with each format
  for (const line of lines) {
    for (const [format, pattern] of Object.entries(FORMAT_PATTERNS)) {
      if (format === "unknown") continue;

      const match = line.match(pattern.lineRegex);
      if (match) {
        const result = pattern.extract(match, line);
        if (result && parseDate(result.date)) {
          formatScores[format as StatementFormat]++;
        }
      }
    }
  }

  // Find the format with the highest score
  let bestFormat: StatementFormat = "unknown";
  let bestScore = 0;

  for (const [format, score] of Object.entries(formatScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestFormat = format as StatementFormat;
    }
  }

  return bestFormat;
}

// ============== TRANSACTION PARSING ==============

/**
 * Parse transactions from statement text using the detected or specified format
 */
export function parseTransactions(text: string, format?: StatementFormat): ParseResult {
  const detectedFormat = format || detectFormat(text);
  const lines = text.split("\n").filter((line) => line.trim());
  const pattern = FORMAT_PATTERNS[detectedFormat];

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let successCount = 0;

  for (const line of lines) {
    // Skip obvious header lines
    if (isHeaderLine(line)) {
      continue;
    }

    // Try to parse with the detected format
    const match = line.match(pattern.lineRegex);
    if (match) {
      const raw = pattern.extract(match, line);
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
          continue;
        }
      }
    }

    // Try fallback parsing if the detected format didn't work
    const fallbackResult = tryFallbackParsing(line);
    if (fallbackResult) {
      transactions.push({
        ...fallbackResult,
        needsReview: true,
        confidence: 0.5,
        originalLine: line,
      });
      successCount++;
    } else if (looksLikeTransaction(line)) {
      errors.push(`Could not parse: ${line.substring(0, 60)}...`);
    }
  }

  const successRate = lines.length > 0 ? successCount / lines.length : 0;

  return {
    transactions,
    format: detectedFormat,
    successRate,
    errors,
  };
}

/**
 * Check if a line looks like a header row
 */
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

  const lower = line.toLowerCase();

  // Check if line contains multiple header keywords
  let headerCount = 0;
  for (const pattern of headerKeywords) {
    if (pattern.test(lower)) {
      headerCount++;
    }
  }

  return headerCount >= 2;
}

/**
 * Check if a line looks like it might be a transaction
 */
function looksLikeTransaction(line: string): boolean {
  // Must have some content
  if (line.trim().length < 10) return false;

  // Should have a date-like pattern
  const hasDate = /\d{1,2}\/\d{1,2}/.test(line) || /\d{4}-\d{2}-\d{2}/.test(line);

  // Should have an amount-like pattern
  const hasAmount = /\$?[\d,]+\.\d{2}/.test(line);

  return hasDate && hasAmount;
}

/**
 * Fallback parsing for lines that don't match known formats
 */
function tryFallbackParsing(line: string): { date: string; name: string; amount: number } | null {
  // Try to extract date
  let date: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern.regex);
    if (match) {
      date = pattern.parse(match);
      break;
    }
  }

  if (!date) return null;

  // Try to extract amount (last number that looks like money)
  const amountMatches = line.match(/(-?\$?[\d,]+\.\d{2})/g);
  if (!amountMatches || amountMatches.length === 0) return null;

  const lastAmount = amountMatches[amountMatches.length - 1];
  const amountResult = parseAmount(lastAmount);
  if (!amountResult) return null;

  // Extract description (everything between date and amount)
  let name = line;

  // Remove the date
  for (const pattern of DATE_PATTERNS) {
    name = name.replace(pattern.regex, "");
  }

  // Remove amounts
  name = name.replace(/(-?\$?[\d,]+\.\d{2})/g, "");

  // Clean up
  name = cleanTransactionName(name);

  if (name.length < 2) return null;

  const signedAmount = amountResult.isDebit ? -amountResult.value : amountResult.value;

  return { date, name, amount: signedAmount };
}

/**
 * Clean up transaction description
 */
function cleanTransactionName(name: string): string {
  return (
    name
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      // Remove common prefixes
      .replace(/^(POS|ACH|CHECK|DEBIT|CREDIT|PURCHASE)\s+/i, "")
      // Remove reference numbers at end
      .replace(/\s+#?\d{6,}$/, "")
      // Remove trailing punctuation
      .replace(/[.,;:]+$/, "")
      // Trim
      .trim()
  );
}

// ============== VALIDATION ==============

/**
 * Validate a parsed transaction
 */
export function validateTransaction(txn: ParsedTransaction): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate date
  const date = new Date(txn.date);
  if (isNaN(date.getTime())) {
    errors.push("Invalid date");
  } else {
    // Check if date is reasonable (not in far future or past)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    if (date > oneMonthAhead) {
      errors.push("Date is in the future");
    }
    if (date < oneYearAgo) {
      errors.push("Date is more than a year old");
    }
  }

  // Validate name
  if (!txn.name || txn.name.length < 2) {
    errors.push("Description is too short");
  }
  if (txn.name.length > 200) {
    errors.push("Description is too long");
  }

  // Validate amount
  if (txn.amount === 0) {
    errors.push("Amount cannot be zero");
  }
  if (Math.abs(txn.amount) > 1000000) {
    errors.push("Amount seems unusually large");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalize a transaction for comparison (used for duplicate detection)
 */
export function normalizeForComparison(txn: {
  date: string;
  name: string;
  amount: number;
}): string {
  return `${txn.date}|${txn.name.toLowerCase().trim()}|${Math.abs(txn.amount).toFixed(2)}`;
}
