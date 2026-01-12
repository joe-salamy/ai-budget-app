// TransactionInputPage - Page for adding transactions with Income, Expense, and Transfer tabs
import { useState, useCallback } from "react";
import { TransactionForm } from "../components/features/TransactionForm";
import { RecentActivityPanel } from "../components/features/RecentActivityPanel";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions, useRecentActivity } from "../hooks/useTransactions";
import type { TransactionType, TransactionFormData } from "../components/features/TransactionForm";

type TabType = "income" | "expense" | "transfer";

function TransactionInputPage() {
  const [activeTab, setActiveTab] = useState<TabType>("expense");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data hooks
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, subcategories, loading: categoriesLoading } = useCategories();
  const { addTransaction, addTransfer } = useTransactions();
  const { recentActivity, loading: activityLoading, error: activityError, refresh: refreshActivity } = useRecentActivity();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: TransactionFormData): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      setSuccessMessage(null);

      try {
        if (activeTab === "transfer") {
          // Handle transfer (creates two transactions)
          const result = await addTransfer(
            data.account_id,
            data.transfer_to_account_id || "",
            data.date,
            data.name,
            parseFloat(data.amount),
            data.subcategory_id || null,
            data.comment || null
          );

          if (result.success) {
            setSuccessMessage("Transfer added successfully!");
            refreshActivity();
            return { success: true };
          } else {
            return { success: false, error: result.error };
          }
        } else {
          // Handle income or expense
          const amount = parseFloat(data.amount);
          const signedAmount = activeTab === "income" ? Math.abs(amount) : -Math.abs(amount);

          const result = await addTransaction({
            account_id: data.account_id,
            date: data.date,
            name: data.name,
            amount: signedAmount,
            subcategory_id: data.subcategory_id || null,
            comment: data.comment || null,
            is_transfer: false,
          });

          if (result.success) {
            setSuccessMessage(
              activeTab === "income"
                ? "Income added successfully!"
                : "Expense added successfully!"
            );
            refreshActivity();
            return { success: true };
          } else {
            return { success: false, error: result.error };
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTab, addTransaction, addTransfer, refreshActivity]
  );

  // Tab configuration
  const tabs: { key: TabType; label: string; type: TransactionType }[] = [
    { key: "income", label: "Income", type: "income" },
    { key: "expense", label: "Expense", type: "expense" },
    { key: "transfer", label: "Transfer", type: "transfer" },
  ];

  const isDataLoading = accountsLoading || categoriesLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Add Transactions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form - Takes up 2/3 on large screens */}
        <div className="lg:col-span-2">
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
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
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
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Go to Setup
                      </a>
                    </div>
                  ) : (
                    <TransactionForm
                      type={tabs.find((t) => t.key === activeTab)?.type || "expense"}
                      accounts={accounts}
                      categories={categories}
                      subcategories={subcategories}
                      onSubmit={handleSubmit}
                      isLoading={isSubmitting}
                      submitLabel={
                        activeTab === "income"
                          ? "Add Income"
                          : activeTab === "expense"
                          ? "Add Expense"
                          : "Add Transfer"
                      }
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
              <li>
                • <strong>Income:</strong> Money coming into your accounts (salary, dividends, refunds)
              </li>
              <li>
                • <strong>Expense:</strong> Money going out of your accounts (purchases, bills, subscriptions)
              </li>
              <li>
                • <strong>Transfer:</strong> Moving money between your own accounts (paying credit card, moving to savings)
              </li>
              <li>
                • The category will auto-populate based on your previous entries for the same description
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Activity Panel - Takes up 1/3 on large screens */}
        <div className="lg:col-span-1">
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
