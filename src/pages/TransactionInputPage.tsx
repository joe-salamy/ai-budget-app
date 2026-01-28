// TransactionInputPage - Page for adding multiple transactions with Income, Expense, and Transfer tabs
import { useState, useCallback } from "react";
import { MultiTransactionTable } from "../components/features/MultiTransactionTable";
import { RecentActivityPanel } from "../components/features/RecentActivityPanel";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions, useRecentActivity } from "../hooks/useTransactions";
import { saveAICorrection } from "../services/ai";
import type {
  TransactionType,
  TransactionRowData,
} from "../components/features/MultiTransactionTable";

type TabType = "income" | "expense" | "transfer";

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
  ];

  const isDataLoading = accountsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Add Transactions</h1>

      {/* Recent Activity Table */}
      <RecentActivityPanel
        recentActivity={recentActivity}
        loading={activityLoading}
        error={activityError}
      />

      {/* Transaction Input Section */}
      <div>
          <div className="rounded-lg border border-border bg-card hover:border-foreground/30 hover:shadow-lg">
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
                        : "text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border"
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
                <div className="mb-4 p-3 rounded-md bg-foreground/10 border border-foreground/20">
                  <p className="text-foreground text-sm">{successMessage}</p>
                </div>
              )}

              {/* Loading State */}
              {isDataLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
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
      </div>
    </div>
  );
}

export default TransactionInputPage;
