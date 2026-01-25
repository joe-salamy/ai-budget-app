// TransactionHistoryPage - Page for viewing, filtering, and managing transactions
import { useState, useCallback, useMemo } from "react";
import { TransactionTable } from "../components/features/TransactionTable";
import { BulkEditModal } from "../components/features/BulkEditModal";
import { ConfirmDeleteModal } from "../components/features/ConfirmDeleteModal";
import { Modal } from "../components/ui/Modal";
import { TransactionForm } from "../components/features/TransactionForm";
import { Input } from "../components/ui/Input";
import { SimpleSelect } from "../components/ui/SimpleSelect";
import { Button } from "../components/ui/Button";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import type { TransactionWithDetails } from "../services/transactions";
import type { TransactionFormData } from "../components/features/TransactionForm";

function TransactionHistoryPage() {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithDetails | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data hooks
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, subcategories, loading: categoriesLoading } = useCategories();
  const {
    transactions,
    loading: transactionsLoading,
    filters,
    setFilters,
    refresh,
    editTransaction,
    removeTransaction,
    bulkRemove,
    bulkUpdateSubcategory,
  } = useTransactions();

  // Apply local filters
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (txn) =>
          txn.name.toLowerCase().includes(query) ||
          txn.comment?.toLowerCase().includes(query) ||
          txn.account_name?.toLowerCase().includes(query) ||
          txn.subcategory_name?.toLowerCase().includes(query)
      );
    }

    // Account filter
    if (accountFilter) {
      result = result.filter((txn) => txn.account_id === accountFilter);
    }

    return result;
  }, [transactions, searchQuery, accountFilter]);

  // Build account options for filter dropdown
  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  // Handle date filter changes
  const handleDateFilterChange = useCallback(
    (field: "startDate" | "endDate", value: string) => {
      if (field === "startDate") {
        setDateFrom(value);
        setFilters({ ...filters, startDate: value || undefined });
      } else {
        setDateTo(value);
        setFilters({ ...filters, endDate: value || undefined });
      }
    },
    [filters, setFilters]
  );

  // Handle edit transaction
  const handleEditTransaction = useCallback((transaction: TransactionWithDetails) => {
    setEditingTransaction(transaction);
  }, []);

  // Handle single delete
  const handleDeleteTransaction = useCallback((id: string) => {
    setDeletingTransactionId(id);
  }, []);

  // Confirm single delete
  const handleConfirmSingleDelete = useCallback(async () => {
    if (!deletingTransactionId) return;

    const result = await removeTransaction(deletingTransactionId);
    if (result.success) {
      setSuccessMessage("Transaction deleted successfully");
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deletingTransactionId);
        return newSet;
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setDeletingTransactionId(null);
  }, [deletingTransactionId, removeTransaction]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    const result = await bulkRemove(Array.from(selectedIds));
    if (result.success) {
      setSuccessMessage(`${result.count} transaction(s) deleted successfully`);
      setSelectedIds(new Set());
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setShowBulkDelete(false);
  }, [selectedIds, bulkRemove]);

  // Handle bulk subcategory update
  const handleBulkEditConfirm = useCallback(
    async (subcategoryId: string | null) => {
      const result = await bulkUpdateSubcategory(Array.from(selectedIds), subcategoryId);
      if (result.success) {
        setSuccessMessage(`${result.count} transaction(s) updated successfully`);
        setSelectedIds(new Set());
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
    [selectedIds, bulkUpdateSubcategory]
  );

  // Handle edit form submit
  const handleEditSubmit = useCallback(
    async (data: TransactionFormData): Promise<{ success: boolean; error?: string }> => {
      if (!editingTransaction) return { success: false, error: "No transaction selected" };

      const amount = parseFloat(data.amount);
      // Preserve the sign - if editing, we keep the original sign intent
      const signedAmount = editingTransaction.amount >= 0 ? Math.abs(amount) : -Math.abs(amount);

      const result = await editTransaction(editingTransaction.id, {
        account_id: data.account_id,
        date: data.date,
        name: data.name,
        amount: signedAmount,
        subcategory_id: data.subcategory_id || null,
        comment: data.comment || null,
      });

      if (result.success) {
        setSuccessMessage("Transaction updated successfully");
        setEditingTransaction(null);
        setTimeout(() => setSuccessMessage(null), 3000);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    },
    [editingTransaction, editTransaction]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setAccountFilter("");
    setDateFrom("");
    setDateTo("");
    setFilters({});
  }, [setFilters]);

  const hasFilters = searchQuery || accountFilter || dateFrom || dateTo;
  const isLoading = accountsLoading || categoriesLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>

        {/* Quick stats */}
        <div className="text-sm text-muted-foreground">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          {hasFilters && " (filtered)"}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
          <p className="text-foreground text-sm">{successMessage}</p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </div>

          {/* Account filter */}
          <SimpleSelect
            options={accountOptions}
            value={accountFilter}
            onChange={setAccountFilter}
            placeholder="All Accounts"
          />

          {/* Date from */}
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFilterChange("startDate", e.target.value)}
            placeholder="From date"
            fullWidth
          />

          {/* Date to */}
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateFilterChange("endDate", e.target.value)}
            placeholder="To date"
            fullWidth
          />
        </div>

        {/* Clear filters button */}
        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-lg border border-foreground/30 bg-foreground/10 p-4 hover:border-foreground/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              {selectedIds.size} transaction{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkEdit(true)}
              >
                Edit Subcategory
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDelete(true)}
              >
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <TransactionTable
        transactions={filteredTransactions}
        loading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Refresh button */}
      <div className="flex justify-center">
        <Button variant="ghost" onClick={refresh} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        selectedCount={selectedIds.size}
        categories={categories}
        subcategories={subcategories}
        onConfirm={handleBulkEditConfirm}
      />

      {/* Bulk Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        itemCount={selectedIds.size}
        itemType="transaction"
        onConfirm={handleBulkDelete}
      />

      {/* Single Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingTransactionId}
        onClose={() => setDeletingTransactionId(null)}
        itemCount={1}
        itemType="transaction"
        onConfirm={handleConfirmSingleDelete}
      />

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaction"
        size="lg"
      >
        {editingTransaction && (
          <TransactionForm
            key={editingTransaction.id}
            type={editingTransaction.amount >= 0 ? "income" : "expense"}
            accounts={accounts}
            categories={categories}
            subcategories={subcategories}
            initialData={{
              date: editingTransaction.date,
              account_id: editingTransaction.account_id,
              name: editingTransaction.name,
              amount: Math.abs(editingTransaction.amount).toString(),
              subcategory_id: editingTransaction.subcategory_id || "",
              comment: editingTransaction.comment || "",
            }}
            onSubmit={handleEditSubmit}
            submitLabel="Save Changes"
          />
        )}
      </Modal>
    </div>
  );
}

export default TransactionHistoryPage;
