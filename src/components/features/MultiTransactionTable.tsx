// MultiTransactionTable component - Tabular input for multiple transactions with per-row type selection
import { useState, useMemo, useCallback, useRef } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui/Button";
import { DatePicker } from "../ui/DatePicker";
import type { SelectOption } from "../ui/SimpleSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { getRecentTransactionByNameAndAccount } from "../../services/transactions";
import { categorizeBatchTransactions, getAICorrection } from "../../services/ai";
import type { Account, Category, Subcategory } from "../../types";

// ============== TYPES ==============

// Removed income/expense type - using signed amounts instead
export interface TransactionRowData {
  id: string; // Unique ID for React key
  date: string;
  account_id: string;
  name: string;
  amount: string; // Signed value: positive for income, negative for expense
  subcategory_id: string;
  comment: string;
  // AI-related tracking
  ai_suggested?: boolean;
  user_corrected?: boolean;
  // Categorization state
  categorizationSource?: "none" | "lookup" | "correction" | "ai";
  isCategorizingRow?: boolean;
}

interface MultiTransactionTableProps {
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  onSubmit: (transactions: TransactionRowData[]) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  onTransferClick?: () => void;
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
    categorizationSource: "none",
  };
}

// ============== COMPONENT ==============

export function MultiTransactionTable({
  accounts,
  categories,
  subcategories,
  onSubmit,
  isLoading = false,
  onTransferClick,
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<
    "date" | "account" | "type" | "name" | "amount" | "subcategory" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Refs for input navigation
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Build account options
  const accountOptions: SelectOption[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  // Get all subcategory options (no longer filtering by income/expense type)
  const subcategoryOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [];
    const grouped = new Map<string, Subcategory[]>();

    subcategories.forEach((sub) => {
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
  }, [categories, subcategories]);

  // Get account name from account ID
  const getAccountName = useCallback(
    (accountId: string): string => {
      const account = accounts.find((a) => a.id === accountId);
      return account?.name || "Unknown Account";
    },
    [accounts]
  );

  // Sorting handler
  const handleSort = (column: "date" | "account" | "name" | "amount" | "subcategory") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Helper for rendering sort icons
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="inline ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    );
  };

  // Sorted rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;

    return [...rows].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortColumn === "date") {
        aValue = a.date;
        bValue = b.date;
      } else if (sortColumn === "account") {
        aValue = getAccountName(a.account_id).toLowerCase();
        bValue = getAccountName(b.account_id).toLowerCase();
      } else if (sortColumn === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortColumn === "amount") {
        aValue = parseFloat(a.amount) || 0;
        bValue = parseFloat(b.amount) || 0;
      } else if (sortColumn === "subcategory") {
        const aSub = subcategories.find((sub) => sub.id === a.subcategory_id);
        const bSub = subcategories.find((sub) => sub.id === b.subcategory_id);
        aValue = aSub?.name.toLowerCase() || "";
        bValue = bSub?.name.toLowerCase() || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortColumn, sortDirection, getAccountName, subcategories]);

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

  // Handle Enter key press to add new row
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowId: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        // Find if this is the last row
        const rowIndex = rows.findIndex((r) => r.id === rowId);
        const isLastRow = rowIndex === rows.length - 1;

        if (isLastRow) {
          // Add a new row
          const lastRow = rows[rows.length - 1];
          const defaultAccountId = lastRow?.account_id || "";
          setRows((prev) => [...prev, createEmptyRow(defaultAccountId)]);
        }
      }
    },
    [rows]
  );

  // Handle arrow key navigation for empty inputs
  const handleArrowNavigation = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowId: string, field: string) => {
      const target = e.target as HTMLInputElement;

      // Only navigate if input is empty
      if (target.value !== "") return;

      const arrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrow.includes(e.key)) return;

      e.preventDefault();

      const rowIndex = rows.findIndex((r) => r.id === rowId);
      if (rowIndex === -1) return;

      // Define field order (navigable fields only)
      const fieldOrder = ["date", "name", "amount", "comment"];

      const currentFieldIndex = fieldOrder.indexOf(field);
      if (currentFieldIndex === -1) return;

      let targetRowIndex = rowIndex;
      let targetFieldIndex = currentFieldIndex;

      // Calculate target position
      switch (e.key) {
        case "ArrowUp":
          targetRowIndex = Math.max(0, rowIndex - 1);
          break;
        case "ArrowDown":
          targetRowIndex = Math.min(rows.length - 1, rowIndex + 1);
          break;
        case "ArrowLeft":
          targetFieldIndex = Math.max(0, currentFieldIndex - 1);
          break;
        case "ArrowRight":
          targetFieldIndex = Math.min(fieldOrder.length - 1, currentFieldIndex + 1);
          break;
      }

      // Focus target input
      const targetRow = rows[targetRowIndex];
      const targetField = fieldOrder[targetFieldIndex];
      const refKey = `${targetRow.id}-${targetField}`;
      const targetInput = inputRefs.current.get(refKey);

      if (targetInput) {
        targetInput.focus();
      }
    },
    [rows]
  );

  // Handle paste event for spreadsheet-style data input
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, rowId: string, field: string) => {
      // Get clipboard data
      const pastedData = e.clipboardData.getData("text");

      // Check if this is multi-cell data (contains tabs or newlines)
      const hasMultipleCells = pastedData.includes("\t") || pastedData.includes("\n");

      if (!hasMultipleCells) {
        // Single cell paste - let default behavior handle it
        return;
      }

      // Prevent default paste behavior for multi-cell data
      e.preventDefault();

      // Parse the pasted data into a 2D array
      const lines = pastedData.split("\n").filter(line => line.trim() !== "");
      const pastedGrid = lines.map(line => line.split("\t"));

      // Find current row index
      const currentRowIndex = rows.findIndex((r) => r.id === rowId);
      if (currentRowIndex === -1) return;

      // Define field order for pasting (only pasteable text/number fields)
      const fieldOrder = ["date", "name", "amount", "comment"];
      const currentFieldIndex = fieldOrder.indexOf(field);
      if (currentFieldIndex === -1) return;

      // Calculate how many new rows we need
      const rowsNeeded = currentRowIndex + pastedGrid.length;
      const newRowsToAdd = Math.max(0, rowsNeeded - rows.length);

      // Create new rows if needed
      const updatedRows = [...rows];
      const lastRow = updatedRows[updatedRows.length - 1];
      const defaultAccountId = lastRow?.account_id || "";

      for (let i = 0; i < newRowsToAdd; i++) {
        updatedRows.push(createEmptyRow(defaultAccountId));
      }

      // Fill in the pasted data
      pastedGrid.forEach((rowData, rowOffset) => {
        const targetRowIndex = currentRowIndex + rowOffset;
        if (targetRowIndex >= updatedRows.length) return;

        const targetRow = updatedRows[targetRowIndex];

        rowData.forEach((cellValue, colOffset) => {
          const targetFieldIndex = currentFieldIndex + colOffset;
          if (targetFieldIndex >= fieldOrder.length) return;

          const targetField = fieldOrder[targetFieldIndex];
          const trimmedValue = cellValue.trim();

          // Update the row with the pasted value
          if (targetField === "amount") {
            // Remove any currency symbols and parse as number
            const cleanedValue = trimmedValue.replace(/[$,]/g, "");
            const numericValue = parseFloat(cleanedValue);
            if (!isNaN(numericValue)) {
              updatedRows[targetRowIndex] = {
                ...targetRow,
                [targetField]: Math.abs(numericValue).toString(),
              };
            }
          } else if (targetField === "date") {
            // Try to parse and format date
            try {
              // Handle various date formats
              const dateValue = new Date(trimmedValue);
              if (!isNaN(dateValue.getTime())) {
                const formattedDate = dateValue.toISOString().split("T")[0];
                updatedRows[targetRowIndex] = {
                  ...targetRow,
                  [targetField]: formattedDate,
                };
              } else {
                // If it's already in YYYY-MM-DD format, use as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
                  updatedRows[targetRowIndex] = {
                    ...targetRow,
                    [targetField]: trimmedValue,
                  };
                }
              }
            } catch {
              // If date parsing fails, try to use as-is if it matches the format
              if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
                updatedRows[targetRowIndex] = {
                  ...targetRow,
                  [targetField]: trimmedValue,
                };
              }
            }
          } else {
            // Text field
            updatedRows[targetRowIndex] = {
              ...targetRow,
              [targetField]: trimmedValue,
            };
          }
        });
      });

      // Update state with the new rows
      setRows(updatedRows);
    },
    [rows]
  );

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

  // Clear all rows
  const handleClearAll = useCallback(() => {
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setErrors({});
    setSubmitError(null);
    setShowClearConfirm(false);
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
        const lookupResponse = await getRecentTransactionByNameAndAccount(row.name, row.account_id);
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
            amount: parseFloat(row.amount), // Use signed amount directly
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
  }, [rows, getAccountName]);

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
    const rowsWithData = rows.filter((row) => row.name.trim() || row.amount || row.account_id);

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

      if (Object.keys(rowErrors).length > 0) {
        newErrors[row.id] = rowErrors;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [rows]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    // Only submit rows that have data
    const rowsToSubmit = rows.filter((row) => row.name.trim() && row.amount && row.account_id);

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
        return row.user_corrected ? (
          <span className="text-xs text-orange-400">Corrected</span>
        ) : (
          <span className="text-xs text-foreground">AI</span>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {uncategorizedCount > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleCategorizeAll}
              disabled={isCategorizingAll}
              isLoading={isCategorizingAll}
            >
              {isCategorizingAll ? "Categorizing..." : `Auto-Categorize (${uncategorizedCount})`}
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
          <p className="text-foreground text-sm">{submitError}</p>
        </div>
      )}

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground w-32"
                onClick={() => handleSort("date")}
              >
                Date
                {renderSortIcon("date")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground w-44"
                onClick={() => handleSort("account")}
              >
                Account
                {renderSortIcon("account")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => handleSort("name")}
              >
                Description
                {renderSortIcon("name")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground w-28"
                onClick={() => handleSort("amount")}
              >
                Amount
                {renderSortIcon("amount")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground w-52"
                onClick={() => handleSort("subcategory")}
              >
                Subcategory
                {renderSortIcon("subcategory")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-32">
                Comment
              </th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((row) => {
              const rowErrors = errors[row.id] || {};

              return (
                <tr key={row.id} className="hover:bg-muted">
                  {/* Date */}
                  <td className="px-4 py-4">
                    <DatePicker
                      date={row.date}
                      onDateChange={(newDate) => handleRowChange(row.id, "date", newDate)}
                      className={rowErrors.date ? "border-foreground" : ""}
                    />
                  </td>

                  {/* Account */}
                  <td className="px-4 py-4">
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

                  {/* Description */}
                  <td className="px-4 py-4">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${row.id}-name`, el);
                        else inputRefs.current.delete(`${row.id}-name`);
                      }}
                      type="text"
                      value={row.name}
                      onChange={(e) => handleRowChange(row.id, "name", e.target.value)}
                      onKeyDown={(e) => {
                        handleKeyDown(e, row.id);
                        handleArrowNavigation(e, row.id, "name");
                      }}
                      onPaste={(e) => handlePaste(e, row.id, "name")}
                      placeholder="e.g., Grocery shopping"
                      className={`w-full px-2 py-1.5 bg-muted border rounded text-sm text-foreground placeholder:text-muted-foreground ${
                        rowErrors.name ? "border-foreground" : "border-border"
                      }`}
                    />
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-foreground pointer-events-none">
                        $
                      </span>
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(`${row.id}-amount`, el);
                          else inputRefs.current.delete(`${row.id}-amount`);
                        }}
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handleRowChange(row.id, "amount", e.target.value)}
                        onKeyDown={(e) => {
                          handleKeyDown(e, row.id);
                          handleArrowNavigation(e, row.id, "amount");
                        }}
                        onPaste={(e) => handlePaste(e, row.id, "amount")}
                        placeholder="100 or -50"
                        className={`w-full pl-6 pr-2 py-1.5 bg-muted border rounded text-sm text-foreground placeholder:text-muted-foreground ${
                          rowErrors.amount ? "border-foreground" : "border-border"
                        }`}
                      />
                    </div>
                  </td>

                  {/* Subcategory */}
                  <td className="px-4 py-4">
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

                  {/* Comment */}
                  <td className="px-4 py-4">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(`${row.id}-comment`, el);
                        else inputRefs.current.delete(`${row.id}-comment`);
                      }}
                      type="text"
                      value={row.comment}
                      onChange={(e) => handleRowChange(row.id, "comment", e.target.value)}
                      onKeyDown={(e) => {
                        handleKeyDown(e, row.id);
                        handleArrowNavigation(e, row.id, "comment");
                      }}
                      onPaste={(e) => handlePaste(e, row.id, "comment")}
                      placeholder="Note..."
                      className="w-full px-2 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </td>

                  {/* Remove button */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove row"
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
                  </td>
                </tr>
              );
            })}

            {/* Ghost row - visual indicator for adding new rows */}
            <tr className="pointer-events-none opacity-50">
              {/* Date */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm">
                  <span className="invisible">2024-01-01</span>
                </div>
              </td>

              {/* Account */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm text-muted-foreground/70">
                  Select...
                </div>
              </td>

              {/* Type */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm text-muted-foreground/70">
                  Expense
                </div>
              </td>

              {/* Description */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm text-muted-foreground/70 italic">
                  Press Enter to add row...
                </div>
              </td>

              {/* Amount */}
              <td className="px-4 py-4">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
                    $
                  </span>
                  <div className="w-full pl-6 pr-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm text-muted-foreground/70">
                    0.00
                  </div>
                </div>
              </td>

              {/* Subcategory */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm text-muted-foreground/70">
                  Select...
                </div>
              </td>

              {/* Comment */}
              <td className="px-4 py-4">
                <div className="w-full px-2 py-1.5 bg-muted/50 border border-border/50 rounded text-sm">
                  <span className="invisible">Note...</span>
                </div>
              </td>

              {/* Remove button placeholder */}
              <td className="px-4 py-4">
                <div className="w-4 h-4"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All
          </Button>
          {onTransferClick && (
            <Button type="button" variant="secondary" onClick={onTransferClick}>
              Add Transfer
            </Button>
          )}
        </div>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
          Add All Transactions
        </Button>
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Clear All Transactions?</h3>
            <p className="text-muted-foreground mb-6">
              This will remove all rows from the table. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
