// StatementParser component - Parse bank/credit card statements and categorize transactions
import { useState, useMemo, useCallback } from "react";
import { Button } from "../ui/Button";
import type { Account, Category, Subcategory } from "../../types";
import {
  parseStatement,
  validateStatementFormat,
  saveStatementTransactions,
} from "../../services/statements";
import type { ParsedTransaction, ParseStatementSummary } from "../../services/statements";
import { saveAICorrection } from "../../services/ai";

// ============== TYPES ==============

interface StatementParserProps {
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  onSuccess?: () => void;
}

type ParsingStep = "idle" | "parsing" | "categorizing" | "done" | "error";

// ============== COMPONENT ==============

export function StatementParser({
  accounts,
  categories,
  subcategories,
  onSuccess,
}: StatementParserProps) {
  // Form state
  const [accountId, setAccountId] = useState<string>("");
  const [statementText, setStatementText] = useState<string>("");

  // Parsing state
  const [parsingStep, setParsingStep] = useState<ParsingStep>("idle");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [summary, setSummary] = useState<ParseStatementSummary | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filter subcategories for expense type (most statement transactions are expenses)
  const expenseSubcategories = useMemo(() => {
    const expenseCategories = categories.filter((cat) => cat.type === "expense");
    const expenseCategoryIds = new Set(expenseCategories.map((cat) => cat.id));
    return subcategories.filter((sub) => expenseCategoryIds.has(sub.category_id));
  }, [categories, subcategories]);

  const incomeSubcategories = useMemo(() => {
    const incomeCategories = categories.filter((cat) => cat.type === "income");
    const incomeCategoryIds = new Set(incomeCategories.map((cat) => cat.id));
    return subcategories.filter((sub) => incomeCategoryIds.has(sub.category_id));
  }, [categories, subcategories]);

  // Build subcategory options for dropdown
  const getSubcategoryOptions = useCallback(
    (isIncome: boolean) => {
      const subs = isIncome ? incomeSubcategories : expenseSubcategories;
      const options: { value: string; label: string }[] = [];

      const grouped = new Map<string, Subcategory[]>();
      subs.forEach((sub) => {
        const existing = grouped.get(sub.category_id) || [];
        grouped.set(sub.category_id, [...existing, sub]);
      });

      grouped.forEach((groupSubs, categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;
        groupSubs.forEach((sub) => {
          options.push({
            value: sub.id,
            label: `${category.name} > ${sub.name}`,
          });
        });
      });

      return options;
    },
    [categories, expenseSubcategories, incomeSubcategories]
  );

  // Handle parse button click
  const handleParse = async () => {
    setErrorMessage(null);
    setParseErrors([]);
    setSaveSuccess(null);

    // Validate inputs
    if (!accountId) {
      setErrorMessage("Please select an account");
      return;
    }

    if (!statementText.trim()) {
      setErrorMessage("Please paste your statement text");
      return;
    }

    // Quick validation
    const validation = validateStatementFormat(statementText);
    if (!validation.valid) {
      setErrorMessage(validation.message || "Invalid statement format");
      return;
    }

    setParsingStep("parsing");

    try {
      const result = await parseStatement(statementText, accountId);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to parse statement");
        setParseErrors(result.errors || []);
        setParsingStep("error");
        return;
      }

      setParsedTransactions(result.transactions || []);
      setSummary(result.summary || null);
      setParseErrors(result.errors || []);
      setParsingStep("done");
    } catch (error) {
      console.error("Parse error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setParsingStep("error");
    }
  };

  // Handle subcategory change for a transaction
  const handleSubcategoryChange = (index: number, subcategoryId: string) => {
    setParsedTransactions((prev) =>
      prev.map((txn, i) => {
        if (i !== index) return txn;

        const subcategory = subcategories.find((s) => s.id === subcategoryId);
        const category = subcategory
          ? categories.find((c) => c.id === subcategory.category_id)
          : null;

        return {
          ...txn,
          subcategory_id: subcategoryId || null,
          subcategory_name: subcategory?.name || null,
          category_name: category?.name || null,
          // Mark as user-corrected if previously AI or lookup
          categorizationSource:
            txn.categorizationSource !== "none" ? txn.categorizationSource : "none",
        };
      })
    );
  };

  // Handle removing a transaction
  const handleRemove = (index: number) => {
    setParsedTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle toggling duplicate inclusion
  const handleToggleDuplicate = (index: number) => {
    setParsedTransactions((prev) =>
      prev.map((txn, i) => (i === index ? { ...txn, isDuplicate: !txn.isDuplicate } : txn))
    );
  };

  // Count non-duplicate transactions
  const nonDuplicateCount = parsedTransactions.filter((t) => !t.isDuplicate).length;

  // Handle save all
  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    try {
      // Filter out duplicates
      const transactionsToSave = parsedTransactions
        .filter((t) => !t.isDuplicate)
        .map((t) => ({
          account_id: accountId,
          date: t.date,
          name: t.name,
          amount: t.amount,
          subcategory_id: t.subcategory_id,
          ai_suggested: t.categorizationSource === "ai",
          user_corrected: false, // Will be set if user changed subcategory
        }));

      if (transactionsToSave.length === 0) {
        setErrorMessage("No transactions to save (all are duplicates)");
        setIsSaving(false);
        return;
      }

      const result = await saveStatementTransactions(transactionsToSave);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to save transactions");
        setIsSaving(false);
        return;
      }

      // Save AI corrections for any user-modified categorizations
      for (const txn of parsedTransactions) {
        if (txn.subcategory_id && txn.categorizationSource === "ai" && !txn.isDuplicate) {
          // Only save correction if user might have changed it
          await saveAICorrection({
            transaction_name: txn.name,
            account_id: accountId,
            ai_suggested_subcategory_id: null, // We don't track original AI suggestion
            user_corrected_subcategory_id: txn.subcategory_id,
          });
        }
      }

      setSaveSuccess(`Successfully added ${result.count} transactions!`);
      // Reset form
      setStatementText("");
      setParsedTransactions([]);
      setSummary(null);
      setParsingStep("idle");
      onSuccess?.();
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStatementText("");
    setParsedTransactions([]);
    setSummary(null);
    setParseErrors([]);
    setErrorMessage(null);
    setSaveSuccess(null);
    setParsingStep("idle");
  };

  // Get categorization source badge
  const getSourceBadge = (txn: ParsedTransaction) => {
    if (txn.isDuplicate) {
      return (
        <span className="px-1.5 py-0.5 text-xs rounded bg-muted text-foreground">Duplicate</span>
      );
    }

    switch (txn.categorizationSource) {
      case "lookup":
        return (
          <span className="px-1.5 py-0.5 text-xs rounded bg-foreground/20 text-foreground">
            History
          </span>
        );
      case "correction":
        return (
          <span className="px-1.5 py-0.5 text-xs rounded bg-foreground/20 text-foreground">
            Preferred
          </span>
        );
      case "ai":
        return (
          <span className="px-1.5 py-0.5 text-xs rounded bg-foreground/20 text-foreground">AI</span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 text-xs rounded bg-muted/20 text-muted-foreground">Manual</span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      {parsingStep === "idle" || parsingStep === "error" ? (
        <div className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
            >
              <option value="">Select an account...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type === "asset" ? "Asset" : "Liability"})
                </option>
              ))}
            </select>
          </div>

          {/* Statement Textarea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Paste Statement</label>
            <textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              placeholder="Paste your bank or credit card statement here...

Example formats supported:
01/15/2024  AMAZON.COM            $45.99
01/14/2024  STARBUCKS             $5.50
01/13/2024  GROCERY STORE         $123.45"
              className="w-full h-64 px-3 py-2 bg-muted border border-border rounded-md text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Supports most bank and credit card statement formats. Each line should contain a date,
              description, and amount.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
              <p className="text-foreground text-sm">{errorMessage}</p>
              {parseErrors.length > 0 && (
                <ul className="mt-2 text-xs text-foreground space-y-1">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more errors</li>}
                </ul>
              )}
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
              <p className="text-foreground text-sm">{saveSuccess}</p>
            </div>
          )}

          {/* Parse Button */}
          <Button
            type="button"
            variant="primary"
            onClick={handleParse}
            disabled={!accountId || !statementText.trim()}
          >
            Parse Statement
          </Button>
        </div>
      ) : parsingStep === "parsing" || parsingStep === "categorizing" ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground">
            {parsingStep === "parsing" ? "Parsing statement..." : "Categorizing transactions..."}
          </p>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-4">
          {/* Summary */}
          {summary && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-medium text-foreground mb-3">Parse Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Found</span>
                  <p className="text-xl font-semibold text-foreground">{summary.total}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duplicates</span>
                  <p className="text-xl font-semibold text-foreground">{summary.duplicates}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">From History</span>
                  <p className="text-xl font-semibold text-foreground">
                    {summary.fromLookup + summary.fromCorrection}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">AI Categorized</span>
                  <p className="text-xl font-semibold text-foreground">{summary.fromAI}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-card">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-foreground w-24">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">Description</th>
                  <th className="px-3 py-2 text-right font-medium text-foreground w-24">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-foreground w-48">
                    Subcategory
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground w-20">Source</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedTransactions.map((txn, index) => {
                  const isIncome = txn.amount >= 0;
                  const subcatOptions = getSubcategoryOptions(isIncome);

                  return (
                    <tr
                      key={index}
                      className={`${
                        txn.isDuplicate
                          ? "bg-card/50 opacity-60"
                          : txn.needsReview
                            ? "bg-foreground/5"
                            : "bg-card"
                      } hover:bg-card/70`}
                    >
                      {/* Date */}
                      <td className="px-3 py-2 text-foreground">{txn.date}</td>

                      {/* Description */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{txn.name}</span>
                          {txn.needsReview && (
                            <span
                              className="text-foreground"
                              title="Needs review - parsing uncertain"
                            >
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2 text-right font-mono text-foreground">
                        {isIncome ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                      </td>

                      {/* Subcategory */}
                      <td className="px-3 py-2">
                        <select
                          value={txn.subcategory_id || ""}
                          onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                          disabled={txn.isDuplicate}
                          className="w-full px-2 py-1 bg-muted border border-border rounded text-sm text-foreground disabled:opacity-50"
                        >
                          <option value="">Select...</option>
                          {subcatOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Source Badge */}
                      <td className="px-3 py-2">{getSourceBadge(txn)}</td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {txn.isDuplicate ? (
                            <button
                              type="button"
                              onClick={() => handleToggleDuplicate(index)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              title="Include anyway"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemove(index)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              title="Remove"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
              <p className="text-foreground text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Start Over
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{nonDuplicateCount} transactions to add</span>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveAll}
                isLoading={isSaving}
                disabled={isSaving || nonDuplicateCount === 0}
              >
                Add All Transactions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Format Help */}
      {parsingStep === "idle" && (
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            Supported formats
          </summary>
          <div className="mt-2 p-4 rounded-lg bg-card/50 text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Credit Card Statements:</strong>
            </p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
              {`01/15  AMAZON.COM           $45.99
01/14  STARBUCKS            $5.50
01/13  GROCERY STORE        $123.45`}
            </pre>

            <p className="mt-4">
              <strong>Bank Statements:</strong>
            </p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
              {`01/15/2024  DIRECT DEPOSIT - PAYROLL    $2,500.00
01/14/2024  ATM WITHDRAWAL              -$100.00
01/13/2024  CHECK #1234                 -$500.00`}
            </pre>

            <p className="mt-4">
              <strong>CSV Format:</strong>
            </p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
              {`2024-01-15, Amazon Purchase, -45.99
2024-01-14, Salary Deposit, 2500.00`}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
