// TransactionTable component - Table with sorting, filtering, and bulk selection
import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import type { TransactionWithDetails } from "../../services/transactions";

// ============== TYPES ==============

interface TransactionTableProps {
  transactions: TransactionWithDetails[];
  loading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEditTransaction: (transaction: TransactionWithDetails) => void;
  onDeleteTransaction: (id: string) => void;
}

type SortField = "date" | "name" | "amount" | "account_name" | "category_name" | "subcategory_name";
type SortDirection = "asc" | "desc";

interface ColumnHeaderProps {
  field: SortField;
  label: string;
  className?: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ============== COLUMN HEADER COMPONENT ==============

function ColumnHeader({
  field,
  label,
  className = "",
  sortField,
  sortDirection,
  onSort,
}: ColumnHeaderProps) {
  const sortIndicator = sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : null;

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 ${className}`}
    >
      {label}
      {sortIndicator && <span className="ml-1">{sortIndicator}</span>}
    </th>
  );
}

// ============== MAIN COMPONENT ==============

export function TransactionTable({
  transactions,
  loading,
  selectedIds,
  onSelectionChange,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "account_name":
          aValue = (a.account_name || "").toLowerCase();
          bValue = (b.account_name || "").toLowerCase();
          break;
        case "category_name":
          aValue = (a.category_name || "").toLowerCase();
          bValue = (b.category_name || "").toLowerCase();
          break;
        case "subcategory_name":
          aValue = (a.subcategory_name || "").toLowerCase();
          bValue = (b.subcategory_name || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortDirection]);

  // Handle column header click for sorting
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  // Handle individual row selection
  const handleRowSelect = useCallback(
    (id: string, index: number, event: React.MouseEvent<HTMLInputElement>) => {
      const newSelected = new Set(selectedIds);
      const isShiftClick = event.shiftKey && lastSelectedIndex !== null;

      if (isShiftClick) {
        // Range selection
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);

        for (let i = start; i <= end; i++) {
          newSelected.add(sortedTransactions[i].id);
        }
      } else {
        // Single selection toggle
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        setLastSelectedIndex(index);
      }

      onSelectionChange(newSelected);
    },
    [selectedIds, lastSelectedIndex, sortedTransactions, onSelectionChange]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedTransactions.length) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all
      onSelectionChange(new Set(sortedTransactions.map((t) => t.id)));
    }
  }, [selectedIds.size, sortedTransactions, onSelectionChange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-700/50"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-800/30 border-t border-gray-700/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting your filters or add some transactions
        </p>
      </div>
    );
  }

  const allSelected = selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < sortedTransactions.length;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/50">
            <tr>
              {/* Checkbox column */}
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
              </th>
              <ColumnHeader
                field="date"
                label="Date"
                className="w-28"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <ColumnHeader
                field="account_name"
                label="Account"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <ColumnHeader
                field="name"
                label="Description"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <ColumnHeader
                field="amount"
                label="Amount"
                className="text-right"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <ColumnHeader
                field="subcategory_name"
                label="Subcategory"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <ColumnHeader
                field="category_name"
                label="Category"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Comment
              </th>
              <th className="px-4 py-3 w-24 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sortedTransactions.map((txn, index) => {
              const isSelected = selectedIds.has(txn.id);
              // Display amount from account perspective: flip sign for liability accounts
              const displayAmount = txn.account_type === "liability" ? -txn.amount : txn.amount;
              const amountColor = displayAmount >= 0 ? "text-green-400" : "text-red-400";

              return (
                <tr
                  key={txn.id}
                  className={`hover:bg-gray-800/30 transition-colors ${
                    isSelected ? "bg-blue-500/10" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => handleRowSelect(txn.id, index, e)}
                      onChange={() => {}} // Controlled by onClick
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {format(new Date(txn.date), "MMM d, yyyy")}
                  </td>

                  {/* Account */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="text-gray-200">{txn.account_name}</span>
                    {txn.is_transfer && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">
                        Transfer
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">
                    {txn.name}
                  </td>

                  {/* Amount */}
                  <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${amountColor}`}>
                    {displayAmount >= 0 ? "+" : ""}
                    {formatCurrency(displayAmount)}
                  </td>

                  {/* Subcategory */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {txn.subcategory_name || (
                      <span className="text-gray-500 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                    {txn.category_name || "-"}
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                    {txn.comment || "-"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => onEditTransaction(txn)}
                      className="text-gray-400 hover:text-blue-400 transition-colors mr-2"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(txn.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700/50">
        <p className="text-sm text-gray-400">
          {selectedIds.size > 0 ? (
            <>
              {selectedIds.size} of {transactions.length} selected
            </>
          ) : (
            <>{transactions.length} transactions</>
          )}
        </p>
      </div>
    </div>
  );
}
