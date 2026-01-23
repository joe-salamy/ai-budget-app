// TransactionForm component - Reusable form for adding/editing transactions
import { useState, useCallback, useMemo, useRef } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SimpleSelect } from "../ui/SimpleSelect";
import type { SelectOption } from "../ui/SimpleSelect";
import { useAutoSave } from "../../hooks/useAutoSave";
import { getRecentTransactionByNameAndAccount } from "../../services/transactions";
import {
  categorizeSingleTransaction,
  getAICorrection,
  saveAICorrection,
} from "../../services/ai";
import type { CategorizationResult } from "../../services/ai";
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
  // AI-related
  ai_suggested?: boolean;
  user_corrected?: boolean;
}

// AI categorization state
type CategorizationSource = "none" | "lookup" | "correction" | "ai";

interface AICategorizationState {
  source: CategorizationSource;
  suggestion: CategorizationResult | null;
  isLoading: boolean;
  userAccepted: boolean;
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

  // AI categorization state
  const [aiState, setAIState] = useState<AICategorizationState>({
    source: "none",
    suggestion: null,
    isLoading: false,
    userAccepted: false,
  });

  // Track the original AI suggestion for correction saving
  const originalAISuggestionRef = useRef<CategorizationResult | null>(null);

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

  // Get account name from account ID
  const getAccountName = useCallback(
    (accountId: string): string => {
      const account = accounts.find((a) => a.id === accountId);
      return account?.name || "Unknown Account";
    },
    [accounts]
  );

  // Handle field changes
  const handleChange = useCallback(
    (field: keyof TransactionFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      setErrors((prev) => ({ ...prev, [field]: undefined }));

      // Clear AI state if name, account, or amount changes
      if (field === "name" || field === "account_id" || field === "amount") {
        setAIState({
          source: "none",
          suggestion: null,
          isLoading: false,
          userAccepted: false,
        });
        originalAISuggestionRef.current = null;
      }

      // Track if user manually changes subcategory after AI suggestion
      if (field === "subcategory_id" && aiState.source === "ai" && aiState.suggestion) {
        if (value !== aiState.suggestion.subcategory_id) {
          setAIState((prev) => ({ ...prev, userAccepted: false }));
        }
      }
    },
    [aiState.source, aiState.suggestion]
  );

  // Lookup previous transaction and AI correction, or trigger AI categorization
  const handleNameBlur = useCallback(async () => {
    if (!formData.name.trim() || !formData.account_id) return;

    // Don't re-categorize if we already have a suggestion for this name
    if (aiState.source !== "none" && aiState.suggestion) return;

    setAIState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Check for AI correction first (user's preferred categorization)
      const correctionResponse = await getAICorrection(
        formData.name,
        formData.account_id
      );

      if (correctionResponse.success && correctionResponse.data) {
        // Found a user correction - use it
        const subcategory = subcategories.find(
          (s) => s.id === correctionResponse.data!.subcategory_id
        );
        const category = subcategory
          ? categories.find((c) => c.id === subcategory.category_id)
          : null;

        setFormData((prev) => ({
          ...prev,
          subcategory_id: correctionResponse.data!.subcategory_id,
        }));
        setAIState({
          source: "correction",
          suggestion: {
            subcategory_id: correctionResponse.data!.subcategory_id,
            subcategory_name: subcategory?.name || "Unknown",
            category_name: category?.name || "Unknown",
            confidence: 1.0,
          },
          isLoading: false,
          userAccepted: true,
        });
        return;
      }

      // Step 2: Check for previous transaction with same name + account
      const lookupResponse = await getRecentTransactionByNameAndAccount(
        formData.name,
        formData.account_id
      );

      if (lookupResponse.success && lookupResponse.data && lookupResponse.data.subcategory_id) {
        // Found a previous transaction - use its category
        const subcategory = subcategories.find(
          (s) => s.id === lookupResponse.data!.subcategory_id
        );
        const category = subcategory
          ? categories.find((c) => c.id === subcategory.category_id)
          : null;

        setFormData((prev) => ({
          ...prev,
          subcategory_id: lookupResponse.data!.subcategory_id || "",
        }));
        setAIState({
          source: "lookup",
          suggestion: {
            subcategory_id: lookupResponse.data!.subcategory_id || "",
            subcategory_name: subcategory?.name || "Unknown",
            category_name: category?.name || "Unknown",
            confidence: 0.95,
          },
          isLoading: false,
          userAccepted: true,
        });
        return;
      }

      // Step 3: No previous match - trigger AI categorization
      // Only trigger if we have an amount (to determine income vs expense)
      if (!formData.amount) {
        setAIState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const amount = parseFloat(formData.amount);
      const adjustedAmount = type === "expense" ? -Math.abs(amount) : Math.abs(amount);

      const aiResponse = await categorizeSingleTransaction({
        name: formData.name,
        account_name: getAccountName(formData.account_id),
        amount: adjustedAmount,
      });

      if (aiResponse.success && aiResponse.data) {
        // AI returned a suggestion
        setFormData((prev) => ({
          ...prev,
          subcategory_id: aiResponse.data!.subcategory_id,
        }));
        setAIState({
          source: "ai",
          suggestion: aiResponse.data,
          isLoading: false,
          userAccepted: false, // User needs to accept or override
        });
        originalAISuggestionRef.current = aiResponse.data;
      } else {
        // AI failed - clear loading state
        setAIState({
          source: "none",
          suggestion: null,
          isLoading: false,
          userAccepted: false,
        });
      }
    } catch {
      // Error during lookup/AI - clear loading state
      setAIState({
        source: "none",
        suggestion: null,
        isLoading: false,
        userAccepted: false,
      });
    }
  }, [
    formData.name,
    formData.account_id,
    formData.amount,
    aiState.source,
    aiState.suggestion,
    type,
    categories,
    subcategories,
    getAccountName,
  ]);

  // Also trigger AI categorization when amount is entered (if name is already filled)
  const handleAmountBlur = useCallback(async () => {
    // Only trigger AI if we have name and account but no categorization yet
    if (
      formData.name.trim() &&
      formData.account_id &&
      formData.amount &&
      aiState.source === "none" &&
      !aiState.isLoading
    ) {
      await handleNameBlur();
    }
  }, [formData.name, formData.account_id, formData.amount, aiState.source, aiState.isLoading, handleNameBlur]);

  // Accept AI suggestion
  const handleAcceptAISuggestion = useCallback(() => {
    setAIState((prev) => ({ ...prev, userAccepted: true }));
  }, []);

  // Override AI suggestion (called when user changes subcategory after AI suggestion)
  const handleSubcategoryChange = useCallback(
    (value: string) => {
      handleChange("subcategory_id", value);

      // If this is an override of an AI suggestion, mark for correction saving
      if (aiState.source === "ai" && aiState.suggestion && value !== aiState.suggestion.subcategory_id) {
        setAIState((prev) => ({
          ...prev,
          userAccepted: false,
        }));
      } else if (aiState.source === "ai" && aiState.suggestion && value === aiState.suggestion.subcategory_id) {
        setAIState((prev) => ({
          ...prev,
          userAccepted: true,
        }));
      }
    },
    [handleChange, aiState.source, aiState.suggestion]
  );

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

    // Determine AI flags
    const wasAISuggested = aiState.source === "ai";
    const wasUserCorrected = Boolean(
      wasAISuggested &&
      originalAISuggestionRef.current &&
      formData.subcategory_id !== originalAISuggestionRef.current.subcategory_id
    );

    // Prepare form data with AI flags
    const submitData: TransactionFormData = {
      ...formData,
      ai_suggested: wasAISuggested,
      user_corrected: wasUserCorrected,
    };

    const result = await onSubmit(submitData);

    if (result.success) {
      // Save AI correction if user overrode the suggestion
      if (wasUserCorrected && originalAISuggestionRef.current && formData.subcategory_id) {
        await saveAICorrection({
          transaction_name: formData.name,
          account_id: formData.account_id,
          ai_suggested_subcategory_id: originalAISuggestionRef.current.subcategory_id,
          user_corrected_subcategory_id: formData.subcategory_id,
        });
      }

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
      setAIState({
        source: "none",
        suggestion: null,
        isLoading: false,
        userAccepted: false,
      });
      originalAISuggestionRef.current = null;
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
        <SimpleSelect
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
        <SimpleSelect
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
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          onBlur={handleAmountBlur}
          placeholder="0.00"
          error={errors.amount}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subcategory */}
        <div>
          <SimpleSelect
            label={`Subcategory${type === "transfer" ? " (Optional)" : ""}`}
            options={subcategoryOptions}
            value={formData.subcategory_id}
            onChange={handleSubcategoryChange}
            placeholder="Select subcategory"
            error={errors.subcategory_id}
          />

          {/* AI Categorization Status */}
          {aiState.isLoading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>AI is categorizing...</span>
            </div>
          )}

          {/* Lookup match hint */}
          {aiState.source === "lookup" && aiState.suggestion && (
            <p className="text-sm text-foreground mt-2">
              Based on previous entry
            </p>
          )}

          {/* User correction match hint */}
          {aiState.source === "correction" && aiState.suggestion && (
            <p className="text-sm text-foreground mt-2">
              Based on your preference
            </p>
          )}

          {/* AI suggestion with accept/override UI */}
          {aiState.source === "ai" && aiState.suggestion && !aiState.isLoading && (
            <div className="mt-2">
              {aiState.userAccepted ? (
                <p className="text-sm text-foreground flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI suggestion accepted
                </p>
              ) : formData.subcategory_id === aiState.suggestion.subcategory_id ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">
                    AI suggests: {aiState.suggestion.category_name} &gt; {aiState.suggestion.subcategory_name}
                    <span className="text-muted-foreground ml-1">
                      ({Math.round(aiState.suggestion.confidence * 100)}% confident)
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleAcceptAISuggestion}
                    className="text-foreground hover:text-foreground"
                    title="Accept suggestion"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="text-sm text-orange-400">
                  Changed from AI suggestion
                </p>
              )}
            </div>
          )}
        </div>

        {/* Category (read-only, derived from subcategory) */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">
            Category
          </label>
          <div className="px-3 py-2 bg-muted border border-border rounded-md text-foreground">
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
