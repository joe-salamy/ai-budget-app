// TransactionForm component - Reusable form for adding/editing transactions
import { useState, useCallback, useMemo } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import type { SelectOption } from "../ui/Select";
import { useAutoSave } from "../../hooks/useAutoSave";
import { getRecentTransactionByNameAndAccount } from "../../services/transactions";
import type { Account, Category, Subcategory } from "../../types";

// ============== TYPES ==============

export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionFormData {
  date: string;
  account_id: string;
  name: string;
  amount: string;
  subcategory_id: string;
  comment: string;
  // Transfer-specific
  transfer_to_account_id?: string;
}

interface TransactionFormProps {
  type: TransactionType;
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<{ success: boolean; error?: string }>;
  onAutoSave?: (data: TransactionFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

// ============== COMPONENT ==============

export function TransactionForm({
  type,
  accounts,
  categories,
  subcategories,
  initialData,
  onSubmit,
  onAutoSave,
  isLoading = false,
  submitLabel = "Add Transaction",
}: TransactionFormProps) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    date: initialData?.date || today,
    account_id: initialData?.account_id || "",
    name: initialData?.name || "",
    amount: initialData?.amount || "",
    subcategory_id: initialData?.subcategory_id || "",
    comment: initialData?.comment || "",
    transfer_to_account_id: initialData?.transfer_to_account_id || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Filter subcategories based on transaction type
  const filteredSubcategories = useMemo(() => {
    const categoryType = type === "income" ? "income" : "expense";
    const relevantCategories = categories.filter((cat) => cat.type === categoryType);
    const relevantCategoryIds = new Set(relevantCategories.map((cat) => cat.id));
    return subcategories.filter((sub) => relevantCategoryIds.has(sub.category_id));
  }, [categories, subcategories, type]);

  // Get category for a subcategory
  const getCategoryForSubcategory = useCallback(
    (subcategoryId: string): Category | undefined => {
      const subcategory = subcategories.find((s) => s.id === subcategoryId);
      if (!subcategory) return undefined;
      return categories.find((c) => c.id === subcategory.category_id);
    },
    [categories, subcategories]
  );

  // Selected category (read-only, derived from subcategory)
  const selectedCategory = useMemo(() => {
    if (!formData.subcategory_id) return null;
    return getCategoryForSubcategory(formData.subcategory_id);
  }, [formData.subcategory_id, getCategoryForSubcategory]);

  // Build account options
  const accountOptions: SelectOption[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: `${acc.name} (${acc.type === "asset" ? "Asset" : "Liability"})`,
    }));
  }, [accounts]);

  // Build transfer destination account options (exclude source account)
  const transferAccountOptions: SelectOption[] = useMemo(() => {
    return accounts
      .filter((acc) => acc.id !== formData.account_id)
      .map((acc) => ({
        value: acc.id,
        label: `${acc.name} (${acc.type === "asset" ? "Asset" : "Liability"})`,
      }));
  }, [accounts, formData.account_id]);

  // Build subcategory options (grouped by category)
  const subcategoryOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [];

    // Group subcategories by category
    const grouped = new Map<string, Subcategory[]>();
    filteredSubcategories.forEach((sub) => {
      const existing = grouped.get(sub.category_id) || [];
      grouped.set(sub.category_id, [...existing, sub]);
    });

    // Build options with category grouping in label
    grouped.forEach((subs, categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      subs.forEach((sub) => {
        options.push({
          value: sub.id,
          label: `${category.name} > ${sub.name}`,
        });
      });
    });

    return options;
  }, [filteredSubcategories, categories]);

  // Handle field changes
  const handleChange = useCallback(
    (field: keyof TransactionFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      setErrors((prev) => ({ ...prev, [field]: undefined }));

      // Clear lookup hint if name changes
      if (field === "name") {
        setLookupHint(null);
      }
    },
    []
  );

  // Lookup previous transaction when name is entered (for auto-categorization)
  const handleNameBlur = useCallback(async () => {
    if (!formData.name || !formData.account_id) return;

    setIsLookingUp(true);
    try {
      const response = await getRecentTransactionByNameAndAccount(
        formData.name,
        formData.account_id
      );

      if (response.success && response.data && response.data.subcategory_id) {
        // Auto-fill subcategory from previous transaction
        setFormData((prev) => ({
          ...prev,
          subcategory_id: response.data!.subcategory_id || "",
        }));
        setLookupHint("Based on previous entry");
      }
    } catch {
      // Ignore lookup errors
    }
    setIsLookingUp(false);
  }, [formData.name, formData.account_id]);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof TransactionFormData, string>> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.account_id) {
      newErrors.account_id = "Account is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (type === "transfer" && !formData.transfer_to_account_id) {
      newErrors.transfer_to_account_id = "Destination account is required";
    }

    if (type === "transfer" && formData.account_id === formData.transfer_to_account_id) {
      newErrors.transfer_to_account_id = "Cannot transfer to the same account";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, type]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await onSubmit(formData);

    if (result.success) {
      // Reset form on success
      setFormData({
        date: today,
        account_id: formData.account_id, // Keep the account selected
        name: "",
        amount: "",
        subcategory_id: "",
        comment: "",
        transfer_to_account_id: "",
      });
      setLookupHint(null);
    } else if (result.error) {
      setErrors({ name: result.error });
    }
  };

  // Auto-save functionality
  useAutoSave({
    delay: 1500,
    onSave: () => {
      if (onAutoSave && formData.name && formData.amount && formData.account_id) {
        onAutoSave(formData);
      }
    },
    dependencies: [
      formData.date,
      formData.account_id,
      formData.name,
      formData.amount,
      formData.subcategory_id,
      formData.comment,
      formData.transfer_to_account_id,
    ],
    enabled: !!onAutoSave,
  });

  // Note: For editing transactions, the parent should pass a unique `key` prop
  // to force remounting the component with new initialData

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
          error={errors.date}
          fullWidth
        />

        {/* Account (source for transfers) */}
        <Select
          label={type === "transfer" ? "From Account" : "Account"}
          options={accountOptions}
          value={formData.account_id}
          onChange={(value) => handleChange("account_id", value)}
          placeholder="Select account"
          error={errors.account_id}
        />
      </div>

      {/* Transfer destination account */}
      {type === "transfer" && (
        <Select
          label="To Account"
          options={transferAccountOptions}
          value={formData.transfer_to_account_id || ""}
          onChange={(value) => handleChange("transfer_to_account_id", value)}
          placeholder="Select destination account"
          error={errors.transfer_to_account_id}
          disabled={!formData.account_id}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name / Description */}
        <div>
          <Input
            label="Description"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={handleNameBlur}
            placeholder="e.g., Grocery shopping"
            error={errors.name}
            fullWidth
          />
          {isLookingUp && (
            <p className="text-sm text-gray-400 mt-1">Looking up previous entries...</p>
          )}
          {lookupHint && (
            <p className="text-sm text-green-400 mt-1">{lookupHint}</p>
          )}
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          placeholder="0.00"
          error={errors.amount}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subcategory */}
        <Select
          label={`Subcategory${type === "transfer" ? " (Optional)" : ""}`}
          options={subcategoryOptions}
          value={formData.subcategory_id}
          onChange={(value) => handleChange("subcategory_id", value)}
          placeholder="Select subcategory"
          error={errors.subcategory_id}
        />

        {/* Category (read-only, derived from subcategory) */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">
            Category
          </label>
          <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300">
            {selectedCategory ? selectedCategory.name : "Select a subcategory first"}
          </div>
        </div>
      </div>

      {/* Comment */}
      <Input
        label="Comment (Optional)"
        value={formData.comment}
        onChange={(e) => handleChange("comment", e.target.value)}
        placeholder="Add a note..."
        fullWidth
      />

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
