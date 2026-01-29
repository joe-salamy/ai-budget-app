// AccountSummary component - Expandable account summary table
import { useState } from "react";
import { format } from "date-fns";
import type {
  AccountSummary as AccountSummaryType,
  NetWorthSummary,
} from "../../services/dashboard";
import { ChevronDown, ChevronRight } from "lucide-react";

// ============== TYPES ==============

interface AccountSummaryProps {
  accounts: AccountSummaryType[];
  netWorth: NetWorthSummary | null;
  loading: boolean;
}

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ============== MAIN COMPONENT ==========================

export function AccountSummary({ accounts, netWorth, loading }: AccountSummaryProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
        <div className="px-4 py-3 bg-card/50 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Account Summary</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-muted/50"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-card/30 border-t border-border/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
        <div className="px-4 py-3 bg-card/50 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Account Summary</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No accounts found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add some accounts to see your summary
          </p>
        </div>
      </div>
    );
  }

  // Group accounts by type and sort alphabetically
  const assetAccounts = accounts
    .filter((a) => a.account_type === "asset")
    .sort((a, b) => a.account_name.localeCompare(b.account_name));
  const liabilityAccounts = accounts
    .filter((a) => a.account_type === "liability")
    .sort((a, b) => a.account_name.localeCompare(b.account_name));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <h3 className="text-lg font-semibold text-white">Account Summary</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-card/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '4%' }}>
                {/* Expand icon */}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '26%' }}>
                Account
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '14%' }}>
                Transactions
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '19%' }}>
                Starting Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '18%' }}>
                Changes
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '19%' }}>
                Ending Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {/* Asset Accounts */}
            {assetAccounts.length > 0 && (
              <>
                <tr className="bg-card/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-xs font-medium text-foreground uppercase"
                  >
                    Assets
                  </td>
                </tr>
                {assetAccounts.map((account) => (
                  <AccountRow
                    key={account.account_id}
                    account={account}
                    isExpanded={expandedAccounts.has(account.account_id)}
                    onToggle={() => toggleAccount(account.account_id)}
                  />
                ))}
              </>
            )}

            {/* Liability Accounts */}
            {liabilityAccounts.length > 0 && (
              <>
                <tr className="bg-card/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-xs font-medium text-foreground uppercase"
                  >
                    Liabilities
                  </td>
                </tr>
                {liabilityAccounts.map((account) => (
                  <AccountRow
                    key={account.account_id}
                    account={account}
                    isExpanded={expandedAccounts.has(account.account_id)}
                    onToggle={() => toggleAccount(account.account_id)}
                  />
                ))}
              </>
            )}
          </tbody>

          {/* Net Worth Footer */}
          {netWorth && (
            <tfoot className="bg-card/50 border-t-2 border-border">
              <tr>
                <td colSpan={2} className="px-4 py-3"></td>
                <td className="px-4 py-3 text-sm font-semibold text-white">Net Worth</td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                  Assets: {formatCurrency(netWorth.total_assets)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                  Liabilities: {formatCurrency(netWorth.total_liabilities)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                  {formatCurrency(netWorth.net_worth)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ============== ACCOUNT ROW COMPONENT ==============

interface AccountRowProps {
  account: AccountSummaryType;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccountRow({ account, isExpanded, onToggle }: AccountRowProps) {
  // Use actual transaction signs without flipping
  const displayChange = account.total_change;
  const changeColor =
    displayChange > 0
      ? "text-foreground"
      : displayChange < 0
        ? "text-foreground"
        : "text-muted-foreground";

  const hasTransactions = account.transactions.length > 0;

  return (
    <>
      {/* Main account row */}
      <tr
        className={`hover:bg-card/50 ${hasTransactions ? "cursor-pointer" : ""}`}
        onClick={hasTransactions ? onToggle : undefined}
      >
        <td className="px-4 py-3 text-muted-foreground" style={{ width: '4%' }}>
          {hasTransactions &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200 font-medium" style={{ width: '26%' }}>
          {account.account_name}
        </td>
        <td className="px-4 py-3 text-sm text-center text-muted-foreground" style={{ width: '14%' }}>
          {hasTransactions ? account.transactions.length : "-"}
        </td>
        <td className="px-4 py-3 text-sm text-right text-foreground" style={{ width: '19%' }}>
          {formatCurrency(account.starting_balance)}
        </td>
        <td className={`px-4 py-3 text-sm text-right font-medium ${changeColor}`} style={{ width: '18%' }}>
          {displayChange >= 0 ? "+" : ""}
          {formatCurrency(displayChange)}
        </td>
        <td className="px-4 py-3 text-sm text-right text-gray-200 font-medium" style={{ width: '19%' }}>
          {formatCurrency(account.ending_balance)}
        </td>
      </tr>

      {/* Expanded transactions */}
      {isExpanded && hasTransactions && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-background/50 border-y border-border/50">
              <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-card/20">
                  <tr>
                    <th className="px-8 py-2 text-left text-xs font-medium text-muted-foreground uppercase" style={{ width: '14%' }}>
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase" style={{ width: '15%' }}>
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase" style={{ width: '17%' }}>
                      Amount
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase" style={{ width: '17%' }}>
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase" style={{ width: '18.5%' }}>
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase" style={{ width: '18.5%' }}>
                      Subcategory
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {/* Display transactions newest-to-oldest */}
                  {[...account.transactions].reverse().map((txn) => {
                    // Use actual transaction signs without flipping
                    const displayAmount = txn.amount;
                    const amountColor = "text-foreground";

                    return (
                      <tr key={txn.id} className="hover:bg-card/20">
                        <td className="px-8 py-2 text-sm text-muted-foreground" style={{ width: '14%' }}>
                          {format(new Date(txn.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2 text-sm text-foreground truncate" style={{ width: '15%' }}>
                          {txn.name}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${amountColor}`} style={{ width: '17%' }}>
                          {displayAmount >= 0 ? "+" : ""}
                          {formatCurrency(displayAmount)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-foreground" style={{ width: '17%' }}>
                          {formatCurrency(txn.running_balance)}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground" style={{ width: '18.5%' }}>
                          {txn.category_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground" style={{ width: '18.5%' }}>
                          {txn.subcategory_name || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
