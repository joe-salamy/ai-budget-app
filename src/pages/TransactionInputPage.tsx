// TransactionInputPage - Page for adding multiple transactions with unified table and transfer modal
import { useState, useCallback } from "react";
import { MultiTransactionTable } from "../components/features/MultiTransactionTable";
import { TransferModal } from "../components/features/TransferModal";
import { RecentActivityPanel } from "../components/features/RecentActivityPanel";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions, useRecentActivity } from "../hooks/useTransactions";
import { saveAICorrection } from "../services/ai";
import type { TransactionRowData } from "../components/features/MultiTransactionTable";
import type { TransferData } from "../components/features/TransferModal";

function TransactionInputPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
            // Use signed amount directly (no conversion needed)
            const amount = parseFloat(txn.amount);

            const result = await addTransaction({
              account_id: txn.account_id,
              date: txn.date,
              name: txn.name,
              amount: amount,
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

        const plural = successCount === 1 ? "" : "s";
        setSuccessMessage(`${successCount} transaction${plural} added successfully!`);
        return { success: true };
      } finally {
        setIsSubmitting(false);
      }
    },
    [addTransaction, refreshActivity]
  );

  // Handle transfer submission from modal
  const handleTransferSubmit = useCallback(
    async (transfer: TransferData): Promise<{ success: boolean; error?: string }> => {
      const result = await addTransfer(
        transfer.fromAccountId,
        transfer.toAccountId,
        transfer.date,
        transfer.name,
        transfer.amount,
        null, // subcategory_id
        transfer.comment || null
      );

      if (result.success) {
        refreshActivity();
      }

      return result;
    },
    [addTransfer, refreshActivity]
  );

  const isDataLoading = accountsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Recent Activity Table */}
      <RecentActivityPanel
        recentActivity={recentActivity}
        loading={activityLoading}
        error={activityError}
      />

      {/* Transaction Input Section */}
      <div>
        <div className="rounded-lg border border-border bg-card hover:border-foreground/30 hover:shadow-lg">
          {/* Table Content */}
          <div className="p-4">
            <h1 className="text-xl font-semibold text-foreground mb-4">Add Transactions</h1>

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
                    accounts={accounts}
                    categories={categories}
                    subcategories={subcategories}
                    onSubmit={handleBatchSubmit}
                    isLoading={isSubmitting}
                    onTransferClick={() => setIsTransferModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        onSubmit={handleTransferSubmit}
      />
    </div>
  );
}

export default TransactionInputPage;
