// TransactionInputPage - Page for adding multiple transactions with Income, Expense, Transfer, and Import tabs
import { useState, useCallback } from "react";
import { MultiTransactionTable } from "../components/features/MultiTransactionTable";
import { RecentActivityPanel } from "../components/features/RecentActivityPanel";
import { StatementParser } from "../components/features/StatementParser";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions, useRecentActivity } from "../hooks/useTransactions";
import { saveAICorrection } from "../services/ai";
import type {
  TransactionType,
  TransactionRowData,
} from "../components/features/MultiTransactionTable";

type TabType = "income" | "expense" | "transfer" | "import";

function TransactionInputPage() {
  const [activeTab, setActiveTab] = useState<TabType>("expense");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data hooks
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, subcategories, loading: categoriesLoading } = useCategories();
  const { addTransaction, addTransfer } = useTransactions();
  const {
    recentActivity,
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivity,
  } = useRecentActivity();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle batch submission of transactions
  const handleBatchSubmit = useCallback(
    async (transactions: TransactionRowData[]): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      setSuccessMessage(null);

      try {
        let successCount = 0;
        const errors: string[] = [];

        for (const txn of transactions) {
          try {
            if (activeTab === "transfer") {
              // Handle transfer (creates two transactions)
              const result = await addTransfer(
                txn.account_id,
                txn.transfer_to_account_id || "",
                txn.date,
                txn.name,
                parseFloat(txn.amount),
                txn.subcategory_id || null,
                txn.comment || null
              );

              if (result.success) {
                successCount++;
              } else {
                errors.push(`${txn.name}: ${result.error}`);
              }
            } else {
              // Handle income or expense
              const amount = parseFloat(txn.amount);
              const signedAmount = activeTab === "income" ? Math.abs(amount) : -Math.abs(amount);

              const result = await addTransaction({
                account_id: txn.account_id,
                date: txn.date,
                name: txn.name,
                amount: signedAmount,
                subcategory_id: txn.subcategory_id || null,
                comment: txn.comment || null,
                is_transfer: false,
                ai_suggested: txn.ai_suggested || false,
                user_corrected: txn.user_corrected || false,
              });

              if (result.success) {
                successCount++;

                // Save AI correction if user corrected an AI suggestion
                if (txn.user_corrected && txn.categorizationSource === "ai" && txn.subcategory_id) {
                  // Note: We don't have the original AI suggestion stored, so we save the correction with null original
                  await saveAICorrection({
                    transaction_name: txn.name,
                    account_id: txn.account_id,
                    ai_suggested_subcategory_id: null,
                    user_corrected_subcategory_id: txn.subcategory_id,
                  });
                }
              } else {
                errors.push(`${txn.name}: ${result.error}`);
              }
            }
          } catch (err) {
            errors.push(`${txn.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
          }
        }

        refreshActivity();

        if (errors.length > 0) {
          return {
            success: false,
            error: `${successCount} added, ${errors.length} failed: ${errors[0]}`,
          };
        }

        const typeLabel =
          activeTab === "income"
            ? "income transaction"
            : activeTab === "expense"
              ? "expense"
              : "transfer";
        const plural = successCount === 1 ? "" : "s";

        setSuccessMessage(`${successCount} ${typeLabel}${plural} added successfully!`);
        return { success: true };
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTab, addTransaction, addTransfer, refreshActivity]
  );

  // Tab configuration
  const tabs: { key: TabType; label: string; type?: TransactionType }[] = [
    { key: "income", label: "Income", type: "income" },
    { key: "expense", label: "Expense", type: "expense" },
    { key: "transfer", label: "Transfer", type: "transfer" },
    { key: "import", label: "Import Statement" },
  ];

  const isDataLoading = accountsLoading || categoriesLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Add Transactions</h1>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Transaction Table - Takes up 3/4 on large screens */}
        <div className="xl:col-span-3">
          <div className="rounded-lg border border-border bg-card">
            {/* Tab Navigation */}
            <div className="border-b border-border">
              <div className="flex gap-1 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium border border-transparent ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Content */}
            <div className="p-4">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/20">
                  <p className="text-green-400 text-sm">{successMessage}</p>
                </div>
              )}

              {/* Loading State */}
              {isDataLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* No accounts message */}
                  {accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You need to create at least one account before adding transactions.
                      </p>
                      <a
                        href="/setup"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent hover:border-white/20"
                      >
                        Go to Setup
                      </a>
                    </div>
                  ) : activeTab === "import" ? (
                    <StatementParser
                      accounts={accounts}
                      categories={categories}
                      subcategories={subcategories}
                      onSuccess={refreshActivity}
                    />
                  ) : (
                    <MultiTransactionTable
                      key={activeTab} // Reset table when switching tabs
                      type={tabs.find((t) => t.key === activeTab)?.type || "expense"}
                      accounts={accounts}
                      categories={categories}
                      subcategories={subcategories}
                      onSubmit={handleBatchSubmit}
                      isLoading={isSubmitting}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-4 p-4 rounded-lg border border-border bg-card/50">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Tips</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              {activeTab === "import" ? (
                <>
                  <li>
                    <strong>Copy statements:</strong> Copy transaction data directly from your bank
                    or credit card website
                  </li>
                  <li>
                    <strong>Supported formats:</strong> Most common statement formats are supported
                    (CSV, tab-separated, text)
                  </li>
                  <li>
                    <strong>Duplicate detection:</strong> Transactions that already exist will be
                    marked as duplicates
                  </li>
                  <li>
                    <strong>Smart categorization:</strong> Transactions are auto-categorized based
                    on history and AI
                  </li>
                  <li>
                    <strong>Review before saving:</strong> You can edit categories and remove
                    transactions before adding them
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <strong>Income:</strong> Money coming into your accounts (salary, dividends,
                    refunds)
                  </li>
                  <li>
                    <strong>Expense:</strong> Money going out of your accounts (purchases, bills,
                    subscriptions)
                  </li>
                  <li>
                    <strong>Transfer:</strong> Moving money between your own accounts (paying credit
                    card, moving to savings)
                  </li>
                  <li>
                    <strong>Batch entry:</strong> Enter multiple transactions at once, then click
                    "Add All" to save them
                  </li>
                  <li>
                    <strong>Auto-Categorize:</strong> Click the "Auto-Categorize" button to have AI
                    suggest categories for uncategorized transactions
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Activity Panel - Takes up 1/4 on large screens */}
        <div className="xl:col-span-1">
          <RecentActivityPanel
            recentActivity={recentActivity}
            loading={activityLoading}
            error={activityError}
          />
        </div>
      </div>
    </div>
  );
}

export default TransactionInputPage;
