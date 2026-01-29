// TransactionHistoryPage - Page for viewing, filtering, and managing transactions
import { useState, useCallback, useMemo } from "react";
import { TransactionTable } from "../components/features/TransactionTable";
import { BulkEditModal } from "../components/features/BulkEditModal";
import { ConfirmDeleteModal } from "../components/features/ConfirmDeleteModal";
import { Modal } from "../components/ui/Modal";
import { TransactionForm } from "../components/features/TransactionForm";
import { Input } from "../components/ui/Input";
import { MultiSelect } from "../components/ui/MultiSelect";
import { DateRangePicker } from "../components/ui/DateRangePicker";
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
  const [accountFilter, setAccountFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [subcategoryFilter, setSubcategoryFilter] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

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
    if (accountFilter.size > 0) {
      result = result.filter((txn) => accountFilter.has(txn.account_id));
    }

    // Category filter
    if (categoryFilter.size > 0) {
      result = result.filter((txn) =>
        txn.category_id ? categoryFilter.has(txn.category_id) : false
      );
    }

    // Subcategory filter
    if (subcategoryFilter.size > 0) {
      result = result.filter((txn) =>
        txn.subcategory_id ? subcategoryFilter.has(txn.subcategory_id) : false
      );
    }

    return result;
  }, [transactions, searchQuery, accountFilter, categoryFilter, subcategoryFilter]);

  // Build options for filter dropdowns
  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts]);

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    return subcategories.map((sub) => ({
      value: sub.id,
      label: sub.name,
    }));
  }, [subcategories]);

  // Handle date filter changes
  const handleDateRangeChange = useCallback(
    (range: { startDate: string; endDate: string }) => {
      setDateRange(range);
      setFilters({
        ...filters,
        startDate: range.startDate || undefined,
        endDate: range.endDate || undefined,
      });
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
    setAccountFilter(new Set());
    setCategoryFilter(new Set());
    setSubcategoryFilter(new Set());
    setDateRange({ startDate: "", endDate: "" });
    setFilters({});
  }, [setFilters]);

  const hasFilters =
    searchQuery ||
    accountFilter.size > 0 ||
    categoryFilter.size > 0 ||
    subcategoryFilter.size > 0 ||
    dateRange.startDate ||
    dateRange.endDate;
  const isLoading = accountsLoading || categoriesLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 rounded-md bg-foreground/10 border border-foreground/20">
          <p className="text-foreground text-sm">{successMessage}</p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card hover:border-foreground/30 hover:shadow-lg">
        {/* Clear filters button - fixed position at top right */}
        <div
          className="flex justify-end px-4 pt-3"
          style={{
            minHeight: hasFilters ? "40px" : "0",
            visibility: hasFilters ? "visible" : "hidden",
          }}
        >
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Search */}
          <div>
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </div>

          {/* Filters in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Account filter */}
            <MultiSelect
              options={accountOptions}
              value={accountFilter}
              onChange={setAccountFilter}
              placeholder="All Accounts"
            />

            {/* Category filter */}
            <MultiSelect
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
            />

            {/* Subcategory filter */}
            <MultiSelect
              options={subcategoryOptions}
              value={subcategoryFilter}
              onChange={setSubcategoryFilter}
              placeholder="All Subcategories"
            />

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-lg border border-foreground/30 bg-foreground/10 p-4 hover:border-foreground/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              {selectedIds.size} transaction{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowBulkEdit(true)}>
                Edit Subcategory
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowBulkDelete(true)}>
                Delete Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
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
            accounts={accounts}
            categories={categories}
            subcategories={subcategories}
            initialData={{
              date: editingTransaction.date,
              account_id: editingTransaction.account_id,
              name: editingTransaction.name,
              amount: editingTransaction.amount.toString(), // Use signed amount directly
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
