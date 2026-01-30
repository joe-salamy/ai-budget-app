// TransactionTable component - Table with sorting, filtering, and bulk selection
import { useState, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { supabase } from "../../lib/supabaseClient";
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

interface AccountBalance {
  initial_balance: number;
  prior_transactions_sum: number;
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
  const [accountBalances, setAccountBalances] = useState<Map<string, AccountBalance>>(new Map());

  // Fetch account initial balances when transactions change
  useEffect(() => {
    async function fetchAccountBalances() {
      if (transactions.length === 0) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get unique account IDs from transactions
        const accountIds = Array.from(new Set(transactions.map((t) => t.account_id)));

        // Fetch account details
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id, initial_balance")
          .in("id", accountIds)
          .is("deleted_at", null);

        if (!accounts) return;

        // Get the earliest transaction date to calculate prior transactions
        const earliestDate = transactions.reduce((min, t) => {
          return t.date < min ? t.date : min;
        }, transactions[0].date);

        // For each account, get sum of transactions before the earliest date in view
        const balanceMap = new Map<string, AccountBalance>();
        await Promise.all(
          accounts.map(async (account) => {
            const { data: priorTransactions } = await supabase
              .from("transactions")
              .select("amount")
              .eq("user_id", user.id)
              .eq("account_id", account.id)
              .lt("date", earliestDate)
              .is("deleted_at", null);

            const priorSum = (priorTransactions || []).reduce((sum, txn) => sum + txn.amount, 0);

            balanceMap.set(account.id, {
              initial_balance: 0, // Always 0 since we use transactions
              prior_transactions_sum: priorSum,
            });
          })
        );

        setAccountBalances(balanceMap);
      } catch (error) {
        console.error("Error fetching account balances:", error);
      }
    }

    fetchAccountBalances();
  }, [transactions]);

  // Sort transactions and calculate running balances
  const sortedTransactionsWithBalance = useMemo(() => {
    // First, sort transactions by date and created_at to ensure consistent ordering
    const sorted = [...transactions].sort((a, b) => {
      // First sort by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Then by created_at for same-day transactions
      if (a.created_at && b.created_at) {
        return a.created_at.localeCompare(b.created_at);
      }
      return 0;
    });

    // Calculate running balances per account
    const accountRunningBalances = new Map<string, number>();

    // Initialize starting balances for each account
    accountBalances.forEach((balance, accountId) => {
      accountRunningBalances.set(
        accountId,
        balance.initial_balance + balance.prior_transactions_sum
      );
    });

    // Add running balance to each transaction
    const withBalances = sorted.map((txn) => {
      const currentBalance = accountRunningBalances.get(txn.account_id) || 0;
      const newBalance = currentBalance + txn.amount;
      accountRunningBalances.set(txn.account_id, newBalance);

      return {
        ...txn,
        running_balance: newBalance,
      };
    });

    // Now apply user-selected sorting
    return withBalances.sort((a, b) => {
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
  }, [transactions, sortField, sortDirection, accountBalances]);

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

      // Don't allow selecting initial balance transactions
      const transaction = sortedTransactionsWithBalance[index];
      if (transaction?.is_initial_balance) {
        return;
      }

      const newSelected = new Set(selectedIds);
      const isShiftClick = event.shiftKey && lastSelectedIndex !== null;

      if (isShiftClick) {
        // Range selection (skip initial balance transactions)
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);

        for (let i = start; i <= end; i++) {
          const txn = sortedTransactionsWithBalance[i];
          if (txn && !txn.is_initial_balance) {
            newSelected.add(txn.id);
          }
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
    [selectedIds, lastSelectedIndex, sortedTransactionsWithBalance, onSelectionChange]
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
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Balance
              </th>
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
            {sortedTransactionsWithBalance.map((txn, index) => {
              const isSelected = selectedIds.has(txn.id);
              // Use actual transaction signs without flipping
              const displayAmount = txn.amount;
              const displayBalance = txn.running_balance ?? 0;
              const amountColor = "text-foreground";

              return (
                <tr
                  key={txn.id}
                  onClick={(e) => !txn.is_initial_balance && handleRowClick(txn.id, index, e)}
                  className={`${txn.is_initial_balance ? "" : "hover:bg-muted cursor-pointer"} ${
                    isSelected ? "bg-foreground/10" : ""
                  } ${txn.is_initial_balance ? "bg-blue-900/20" : ""}`}
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
                    {txn.is_initial_balance && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-500/30 text-blue-200">
                        Initial
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

                  {/* Balance */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-foreground">
                    {formatCurrency(displayBalance)}
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
                      {!txn.is_initial_balance && (
                        <>
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
                        </>
                      )}
                      {txn.is_initial_balance && (
                        <span className="text-xs text-muted-foreground italic">
                          Edit in Settings
                        </span>
                      )}
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
