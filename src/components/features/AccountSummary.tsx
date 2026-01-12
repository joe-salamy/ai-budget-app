// AccountSummary component - Expandable account summary table
import { useState } from "react";
import { format } from "date-fns";
import type { AccountSummary as AccountSummaryType, NetWorthSummary } from "../../services/dashboard";
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

function getAccountTypeLabel(type: string): string {
  return type === "asset" ? "Asset" : "Liability";
}

function getAccountTypeColor(type: string): string {
  return type === "asset" ? "text-blue-400" : "text-orange-400";
}

// ============== MAIN COMPONENT ==============

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
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Account Summary</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-700/50"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-800/30 border-t border-gray-700/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Account Summary</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No accounts found</p>
          <p className="text-sm text-gray-500 mt-2">
            Add some accounts to see your summary
          </p>
        </div>
      </div>
    );
  }

  // Group accounts by type
  const assetAccounts = accounts.filter((a) => a.account_type === "asset");
  const liabilityAccounts = accounts.filter((a) => a.account_type === "liability");

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Account Summary</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                {/* Expand icon */}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Account
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Starting Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Changes
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ending Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {/* Asset Accounts */}
            {assetAccounts.length > 0 && (
              <>
                <tr className="bg-gray-800/20">
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-blue-400 uppercase">
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
                <tr className="bg-gray-800/20">
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-orange-400 uppercase">
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
            <tfoot className="bg-gray-800/50 border-t-2 border-gray-600">
              <tr>
                <td colSpan={2} className="px-4 py-3"></td>
                <td className="px-4 py-3 text-sm font-semibold text-white">
                  Net Worth
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-400">
                  Assets: {formatCurrency(netWorth.total_assets)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-400">
                  Liabilities: {formatCurrency(netWorth.total_liabilities)}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-bold ${
                    netWorth.net_worth >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
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
  const changeColor =
    account.total_change > 0
      ? "text-green-400"
      : account.total_change < 0
      ? "text-red-400"
      : "text-gray-400";

  const hasTransactions = account.transactions.length > 0;

  return (
    <>
      {/* Main account row */}
      <tr
        className={`hover:bg-gray-800/30 transition-colors ${
          hasTransactions ? "cursor-pointer" : ""
        }`}
        onClick={hasTransactions ? onToggle : undefined}
      >
        <td className="px-4 py-3 text-gray-400">
          {hasTransactions && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </td>
        <td className={`px-4 py-3 text-sm ${getAccountTypeColor(account.account_type)}`}>
          {getAccountTypeLabel(account.account_type)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200 font-medium">
          {account.account_name}
          {hasTransactions && (
            <span className="ml-2 text-xs text-gray-500">
              ({account.transactions.length} transactions)
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-right text-gray-300">
          {formatCurrency(account.starting_balance)}
        </td>
        <td className={`px-4 py-3 text-sm text-right font-medium ${changeColor}`}>
          {account.total_change >= 0 ? "+" : ""}
          {formatCurrency(account.total_change)}
        </td>
        <td className="px-4 py-3 text-sm text-right text-gray-200 font-medium">
          {formatCurrency(account.ending_balance)}
        </td>
      </tr>

      {/* Expanded transactions */}
      {isExpanded && hasTransactions && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-gray-900/50 border-y border-gray-700/50">
              <table className="min-w-full">
                <thead className="bg-gray-800/20">
                  <tr>
                    <th className="px-8 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Subcategory
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {account.transactions.map((txn) => {
                    const amountColor =
                      txn.amount >= 0 ? "text-green-400" : "text-red-400";

                    return (
                      <tr key={txn.id} className="hover:bg-gray-800/20">
                        <td className="px-8 py-2 text-sm text-gray-400">
                          {format(new Date(txn.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                          {txn.name}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${amountColor}`}>
                          {txn.amount >= 0 ? "+" : ""}
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-300">
                          {formatCurrency(txn.running_balance)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-400">
                          {txn.category_name || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-400">
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
