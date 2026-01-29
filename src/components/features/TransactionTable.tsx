// TransactionTable component - Table with sorting, filtering, and bulk selection
import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
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
      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground ${className}`}
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

  // Handle row click for selection
  const handleRowClick = useCallback(
    (id: string, index: number, event: React.MouseEvent<HTMLTableRowElement>) => {
      // Don't select if clicking on action buttons
      const target = event.target as HTMLElement;
      if (target.closest("button")) {
        return;
      }

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

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
        <div className="animate-pulse">
          <div className="h-12 bg-muted/50"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-card/30 border-t border-border/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center hover:border-foreground/30 hover:shadow-lg">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or add some transactions
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Comment
              </th>
              <th className="px-4 py-3 w-24 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedTransactions.map((txn, index) => {
              const isSelected = selectedIds.has(txn.id);
              // Display amount from account perspective: flip sign for liability accounts
              const displayAmount = txn.account_type === "liability" ? -txn.amount : txn.amount;
              const amountColor = "text-foreground";

              return (
                <tr
                  key={txn.id}
                  onClick={(e) => handleRowClick(txn.id, index, e)}
                  className={`hover:bg-muted cursor-pointer ${
                    isSelected ? "bg-foreground/10" : ""
                  }`}
                >
                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {format(new Date(txn.date), "MM/dd/yyyy")}
                  </td>

                  {/* Account */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="text-gray-200">{txn.account_name}</span>
                    {txn.is_transfer && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-foreground/20 text-foreground">
                        Transfer
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{txn.name}</td>

                  {/* Amount */}
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${amountColor}`}
                  >
                    {displayAmount >= 0 ? "+" : ""}
                    {formatCurrency(displayAmount)}
                  </td>

                  {/* Subcategory */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {txn.subcategory_name || (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {txn.category_name || "-"}
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {txn.comment || "-"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTransaction(txn)}
                        className="text-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTransaction(txn.id)}
                        className="text-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
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
