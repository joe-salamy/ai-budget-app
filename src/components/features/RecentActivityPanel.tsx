// RecentActivityPanel component - Shows recent transaction activity for each account in a sortable table
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { RecentActivity } from "../../hooks/useTransactions";

interface RecentActivityPanelProps {
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
}

/**
 * Formats a number as currency (USD)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Table showing the most recent transaction for each account
 * Helps users know which transactions to add next
 */
export function RecentActivityPanel({ recentActivity, loading, error }: RecentActivityPanelProps) {
  const [sortColumn, setSortColumn] = useState<
    "account" | "type" | "balance" | "transaction" | "date" | "amount" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Sorting handler
  const handleSort = (
    column: "account" | "type" | "balance" | "transaction" | "date" | "amount"
  ) => {
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

  // Sorted data
  const sortedActivity = useMemo(() => {
    if (!sortColumn) return recentActivity;

    return [...recentActivity].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortColumn === "account") {
        aValue = a.account_name.toLowerCase();
        bValue = b.account_name.toLowerCase();
      } else if (sortColumn === "type") {
        aValue = a.account_type.toLowerCase();
        bValue = b.account_type.toLowerCase();
      } else if (sortColumn === "balance") {
        aValue = a.current_balance;
        bValue = b.current_balance;
      } else if (sortColumn === "transaction") {
        aValue = a.recent_transaction?.name.toLowerCase() || "";
        bValue = b.recent_transaction?.name.toLowerCase() || "";
      } else if (sortColumn === "date") {
        aValue = a.recent_transaction?.date || "";
        bValue = b.recent_transaction?.date || "";
      } else if (sortColumn === "amount") {
        const aAmount = a.recent_transaction
          ? a.account_type === "liability"
            ? -a.recent_transaction.amount
            : a.recent_transaction.amount
          : 0;
        const bAmount = b.recent_transaction
          ? b.account_type === "liability"
            ? -b.recent_transaction.amount
            : b.recent_transaction.amount
          : 0;
        aValue = aAmount;
        bValue = bAmount;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [recentActivity, sortColumn, sortDirection]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-lg">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-foreground/20 bg-foreground/10 p-4 hover:border-foreground/30 hover:shadow-lg">
        <h2 className="text-xl font-semibold text-foreground mb-2">Recent Activity</h2>
        <p className="text-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (recentActivity.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-lg">
        <h2 className="text-xl font-semibold text-foreground mb-2">Recent Activity</h2>
        <p className="text-muted-foreground text-sm">
          No accounts yet. Create an account in Settings to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card hover:border-foreground/30 hover:shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("account")}
                >
                  Account
                  {renderSortIcon("account")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("type")}
                >
                  Type
                  {renderSortIcon("type")}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("balance")}
                >
                  Balance
                  {renderSortIcon("balance")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("transaction")}
                >
                  Most Recent Transaction
                  {renderSortIcon("transaction")}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("amount")}
                >
                  Amount
                  {renderSortIcon("amount")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("date")}
                >
                  Date
                  {renderSortIcon("date")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedActivity.map((activity) => {
                const isAsset = activity.account_type === "asset";
                const displayAmount = activity.recent_transaction
                  ? activity.account_type === "liability"
                    ? -activity.recent_transaction.amount
                    : activity.recent_transaction.amount
                  : null;

                return (
                  <tr key={activity.account_id} className="hover:bg-muted">
                    <td className="px-4 py-4 text-sm text-foreground font-medium">
                      {activity.account_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {isAsset ? "Asset" : "Liability"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-foreground">
                      {formatCurrency(activity.current_balance)}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {activity.recent_transaction?.name || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-foreground">
                      {displayAmount !== null ? (
                        <>
                          {displayAmount >= 0 ? "+" : ""}
                          {formatCurrency(displayAmount)}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {activity.recent_transaction
                        ? format(new Date(activity.recent_transaction.date), "MM/dd/yyyy")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
