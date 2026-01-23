// MultiTransactionTable component - Tabular input for multiple transactions
import { useState, useMemo, useCallback } from "react";
import { Button } from "../ui/Button";
import type { SelectOption } from "../ui/SimpleSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { getRecentTransactionByNameAndAccount } from "../../services/transactions";
import { categorizeBatchTransactions, getAICorrection } from "../../services/ai";
import type { Account, Category, Subcategory } from "../../types";

// ============== TYPES ==============

export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionRowData {
  id: string; // Unique ID for React key
  date: string;
  account_id: string;
  name: string;
  amount: string;
  subcategory_id: string;
  comment: string;
  // Transfer-specific
  transfer_to_account_id?: string;
  // AI-related tracking
  ai_suggested?: boolean;
  user_corrected?: boolean;
  // Categorization state
  categorizationSource?: "none" | "lookup" | "correction" | "ai";
  isCategorizingRow?: boolean;
}

interface MultiTransactionTableProps {
  type: TransactionType;
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  onSubmit: (transactions: TransactionRowData[]) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

// Generate unique ID for rows
let rowIdCounter = 0;
function generateRowId(): string {
  return `row-${Date.now()}-${rowIdCounter++}`;
}

// Create empty row with today's date
function createEmptyRow(defaultAccountId: string = ""): TransactionRowData {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: generateRowId(),
    date: today,
    account_id: defaultAccountId,
    name: "",
    amount: "",
    subcategory_id: "",
    comment: "",
    transfer_to_account_id: "",
    categorizationSource: "none",
  };
}

// ============== COMPONENT ==============

export function MultiTransactionTable({
  type,
  accounts,
  categories,
  subcategories,
  onSubmit,
  isLoading = false,
}: MultiTransactionTableProps) {
  // Initialize with 3 empty rows
  const [rows, setRows] = useState<TransactionRowData[]>(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [isCategorizingAll, setIsCategorizingAll] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Filter subcategories based on transaction type
  const filteredSubcategories = useMemo(() => {
    const categoryType = type === "income" ? "income" : "expense";
    const relevantCategories = categories.filter((cat) => cat.type === categoryType);
    const relevantCategoryIds = new Set(relevantCategories.map((cat) => cat.id));
    return subcategories.filter((sub) => relevantCategoryIds.has(sub.category_id));
  }, [categories, subcategories, type]);

  // Build account options
  const accountOptions: SelectOption[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: `${acc.name} (${acc.type === "asset" ? "Asset" : "Liability"})`,
    }));
  }, [accounts]);

  // Build subcategory options (grouped by category)
  const subcategoryOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [];
    const grouped = new Map<string, Subcategory[]>();

    filteredSubcategories.forEach((sub) => {
      const existing = grouped.get(sub.category_id) || [];
      grouped.set(sub.category_id, [...existing, sub]);
    });

    grouped.forEach((subs, categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      subs.forEach((sub) => {
        options.push({
          value: sub.id,
          label: `${category.name} > ${sub.name}`,
        });
      });
    });

    return options;
  }, [filteredSubcategories, categories]);

  // Get account name from account ID
  const getAccountName = useCallback(
    (accountId: string): string => {
      const account = accounts.find((a) => a.id === accountId);
      return account?.name || "Unknown Account";
    },
    [accounts]
  );

  // Handle field changes for a specific row
  const handleRowChange = useCallback(
    (rowId: string, field: keyof TransactionRowData, value: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;

          const updated = { ...row, [field]: value };

          // Reset categorization if name, account, or amount changes
          if (field === "name" || field === "account_id" || field === "amount") {
            updated.categorizationSource = "none";
            updated.ai_suggested = false;
            updated.user_corrected = false;
          }

          // Track user correction if subcategory changed after AI suggestion
          if (field === "subcategory_id" && row.categorizationSource === "ai") {
            updated.user_corrected = true;
          }

          return updated;
        })
      );

      // Clear error for this field
      setErrors((prev) => {
        const rowErrors = { ...prev[rowId] };
        delete rowErrors[field];
        return { ...prev, [rowId]: rowErrors };
      });
    },
    []
  );

  // Add a new row
  const addRow = useCallback(() => {
    // Use the account from the last row as default
    const lastRow = rows[rows.length - 1];
    const defaultAccountId = lastRow?.account_id || "";
    setRows((prev) => [...prev, createEmptyRow(defaultAccountId)]);
  }, [rows]);

  // Remove a row
  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev; // Keep at least 1 row
      return prev.filter((row) => row.id !== rowId);
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[rowId];
      return newErrors;
    });
  }, []);

  // Categorize all uncategorized transactions
  const handleCategorizeAll = useCallback(async () => {
    setIsCategorizingAll(true);

    try {
      // Find rows that need categorization (have name, account, amount but no subcategory)
      const rowsNeedingAI: { row: TransactionRowData; index: number }[] = [];

      const updatedRows = [...rows];

      // First pass: check for lookups and corrections
      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        if (!row.name.trim() || !row.account_id || !row.amount || row.subcategory_id) {
          continue; // Skip rows that are incomplete or already categorized
        }

        // Check for AI correction first
        const correctionResponse = await getAICorrection(row.name, row.account_id);
        if (correctionResponse.success && correctionResponse.data) {
          updatedRows[i] = {
            ...row,
            subcategory_id: correctionResponse.data.subcategory_id,
            categorizationSource: "correction",
            ai_suggested: false,
          };
          continue;
        }

        // Check for previous transaction
        const lookupResponse = await getRecentTransactionByNameAndAccount(
          row.name,
          row.account_id
        );
        if (lookupResponse.success && lookupResponse.data?.subcategory_id) {
          updatedRows[i] = {
            ...row,
            subcategory_id: lookupResponse.data.subcategory_id,
            categorizationSource: "lookup",
            ai_suggested: false,
          };
          continue;
        }

        // Need AI categorization
        rowsNeedingAI.push({ row, index: i });
      }

      // Second pass: batch AI categorization for remaining rows
      if (rowsNeedingAI.length > 0) {
        const BATCH_SIZE = 25;

        for (let batchStart = 0; batchStart < rowsNeedingAI.length; batchStart += BATCH_SIZE) {
          const batch = rowsNeedingAI.slice(batchStart, batchStart + BATCH_SIZE);

          const transactionsForAI = batch.map(({ row }) => ({
            name: row.name,
            account_name: getAccountName(row.account_id),
            amount: type === "expense"
              ? -Math.abs(parseFloat(row.amount))
              : Math.abs(parseFloat(row.amount)),
          }));

          const aiResponse = await categorizeBatchTransactions(transactionsForAI);

          if (aiResponse.success && aiResponse.data) {
            // Apply AI results to corresponding rows
            aiResponse.data.forEach((result, idx) => {
              const { index } = batch[idx];
              updatedRows[index] = {
                ...updatedRows[index],
                subcategory_id: result.subcategory_id,
                categorizationSource: "ai",
                ai_suggested: true,
                user_corrected: false,
              };
            });
          }
        }
      }

      setRows(updatedRows);
    } catch (error) {
      console.error("Error during batch categorization:", error);
    } finally {
      setIsCategorizingAll(false);
    }
  }, [rows, getAccountName, type]);

  // Count uncategorized rows (rows with data but no subcategory)
  const uncategorizedCount = useMemo(() => {
    return rows.filter(
      (row) => row.name.trim() && row.account_id && row.amount && !row.subcategory_id
    ).length;
  }, [rows]);

  // Validate all rows
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    // Find rows with any data entered
    const rowsWithData = rows.filter(
      (row) => row.name.trim() || row.amount || row.account_id
    );

    if (rowsWithData.length === 0) {
      setSubmitError("Please enter at least one transaction");
      return false;
    }

    rowsWithData.forEach((row) => {
      const rowErrors: Record<string, string> = {};

      if (!row.date) {
        rowErrors.date = "Required";
        hasErrors = true;
      }
      if (!row.account_id) {
        rowErrors.account_id = "Required";
        hasErrors = true;
      }
      if (!row.name.trim()) {
        rowErrors.name = "Required";
        hasErrors = true;
      }
      if (!row.amount || parseFloat(row.amount) <= 0) {
        rowErrors.amount = "Must be > 0";
        hasErrors = true;
      }
      if (type === "transfer" && !row.transfer_to_account_id) {
        rowErrors.transfer_to_account_id = "Required";
        hasErrors = true;
      }
      if (type === "transfer" && row.account_id === row.transfer_to_account_id) {
        rowErrors.transfer_to_account_id = "Same account";
        hasErrors = true;
      }

      if (Object.keys(rowErrors).length > 0) {
        newErrors[row.id] = rowErrors;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [rows, type]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    // Only submit rows that have data
    const rowsToSubmit = rows.filter(
      (row) => row.name.trim() && row.amount && row.account_id
    );

    const result = await onSubmit(rowsToSubmit);

    if (result.success) {
      // Reset to empty rows
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
      setErrors({});
    } else if (result.error) {
      setSubmitError(result.error);
    }
  };

  // Get categorization indicator for a row
  const getCategorizationIndicator = (row: TransactionRowData): React.ReactNode => {
    if (!row.subcategory_id) return null;

    switch (row.categorizationSource) {
      case "lookup":
        return <span className="text-xs text-foreground">Previous</span>;
      case "correction":
        return <span className="text-xs text-foreground">Preferred</span>;
      case "ai":
        return row.user_corrected
          ? <span className="text-xs text-orange-400">Corrected</span>
          : <span className="text-xs text-foreground">AI</span>;
      default:
        return null;
    }
  };

  const isTransfer = type === "transfer";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={addRow}>
            + Add Row
          </Button>
          {uncategorizedCount > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleCategorizeAll}
              disabled={isCategorizingAll}
              isLoading={isCategorizingAll}
            >
              {isCategorizingAll
                ? "Categorizing..."
                : `Auto-Categorize (${uncategorizedCount})`}
            </Button>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {rows.filter((r) => r.name.trim() && r.amount).length} transaction(s) entered
        </span>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
          <p className="text-foreground text-sm">{submitError}</p>
        </div>
      )}

      {/* Transaction Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-foreground w-32">Date</th>
              <th className="px-3 py-2 text-left font-medium text-foreground w-40">
                {isTransfer ? "From Account" : "Account"}
              </th>
              {isTransfer && (
                <th className="px-3 py-2 text-left font-medium text-foreground w-40">To Account</th>
              )}
              <th className="px-3 py-2 text-left font-medium text-foreground">Description</th>
              <th className="px-3 py-2 text-left font-medium text-foreground w-28">Amount</th>
              {!isTransfer && (
                <th className="px-3 py-2 text-left font-medium text-foreground w-48">Subcategory</th>
              )}
              <th className="px-3 py-2 text-left font-medium text-foreground w-32">Comment</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const rowErrors = errors[row.id] || {};

              // Build transfer destination options (exclude source account)
              const transferAccountOptions: SelectOption[] = accounts
                .filter((acc) => acc.id !== row.account_id)
                .map((acc) => ({
                  value: acc.id,
                  label: `${acc.name} (${acc.type === "asset" ? "Asset" : "Liability"})`,
                }));

              return (
                <tr key={row.id} className="bg-card hover:bg-card/50">
                  {/* Date */}
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleRowChange(row.id, "date", e.target.value)}
                      className={`w-full px-2 py-1.5 bg-muted border rounded text-sm text-foreground ${
                        rowErrors.date ? "border-foreground" : "border-border"
                      }`}
                    />
                  </td>

                  {/* Account */}
                  <td className="px-2 py-1">
                    <Select
                      value={row.account_id || undefined}
                      onValueChange={(value) => handleRowChange(row.id, "account_id", value)}
                    >
                      <SelectTrigger
                        className={`w-full h-8 px-2 text-sm ${
                          rowErrors.account_id ? "border-foreground" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accountOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* To Account (transfers only) */}
                  {isTransfer && (
                    <td className="px-2 py-1">
                      <Select
                        value={row.transfer_to_account_id || undefined}
                        onValueChange={(value) => handleRowChange(row.id, "transfer_to_account_id", value)}
                        disabled={!row.account_id}
                      >
                        <SelectTrigger
                          className={`w-full h-8 px-2 text-sm ${
                            rowErrors.transfer_to_account_id ? "border-foreground" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {transferAccountOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}

                  {/* Description */}
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleRowChange(row.id, "name", e.target.value)}
                      placeholder="e.g., Grocery shopping"
                      className={`w-full px-2 py-1.5 bg-muted border rounded text-sm text-foreground placeholder:text-muted-foreground ${
                        rowErrors.name ? "border-foreground" : "border-border"
                      }`}
                    />
                  </td>

                  {/* Amount */}
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      onChange={(e) => handleRowChange(row.id, "amount", e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-2 py-1.5 bg-muted border rounded text-sm text-foreground placeholder:text-muted-foreground ${
                        rowErrors.amount ? "border-foreground" : "border-border"
                      }`}
                    />
                  </td>

                  {/* Subcategory (not for transfers) */}
                  {!isTransfer && (
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Select
                          value={row.subcategory_id || undefined}
                          onValueChange={(value) => handleRowChange(row.id, "subcategory_id", value)}
                        >
                          <SelectTrigger className="flex-1 h-8 px-2 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getCategorizationIndicator(row)}
                      </div>
                    </td>
                  )}

                  {/* Comment */}
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.comment}
                      onChange={(e) => handleRowChange(row.id, "comment", e.target.value)}
                      placeholder="Note..."
                      className="w-full px-2 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </td>

                  {/* Remove button */}
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove row"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {type === "income"
            ? "Add All Income"
            : type === "expense"
            ? "Add All Expenses"
            : "Add All Transfers"}
        </Button>
      </div>
    </form>
  );
}
