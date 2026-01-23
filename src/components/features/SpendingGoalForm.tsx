// SpendingGoalForm component - Form for creating/editing spending goals
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SimpleSelect } from "@/components/ui/SimpleSelect";
import type { SelectGroup } from "@/components/ui/SimpleSelect";
import type { Subcategory, Category, GoalPeriod } from "@/types";

interface SpendingGoalFormProps {
  subcategories: Subcategory[];
  categories: Category[];
  existingGoalSubcategoryIds?: string[];
  initialData?: {
    subcategory_id: string;
    amount: number;
    period: GoalPeriod;
    start_date: string;
    end_date?: string | null;
  };
  onSubmit: (data: {
    subcategoryId: string;
    amount: number;
    period: GoalPeriod;
    startDate: string;
    endDate?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  disableSubcategoryChange?: boolean;
}

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export function SpendingGoalForm({
  subcategories,
  categories,
  existingGoalSubcategoryIds = [],
  initialData,
  onSubmit,
  submitLabel = "Save Goal",
  showCancel = false,
  onCancel,
  disableSubcategoryChange = false,
}: SpendingGoalFormProps) {
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategory_id || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [period, setPeriod] = useState<GoalPeriod>(initialData?.period || "monthly");
  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(initialData?.end_date || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    subcategoryId?: string;
    amount?: string;
    startDate?: string;
  }>({});

  // Filter expense subcategories only (spending goals are for expenses)
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const expenseCategoryIds = new Set(expenseCategories.map((c) => c.id));
  const availableSubcategories = subcategories.filter(
    (s) =>
      expenseCategoryIds.has(s.category_id) &&
      (!existingGoalSubcategoryIds.includes(s.id) || s.id === initialData?.subcategory_id)
  );

  // Group subcategories by category for the select component
  const selectGroups: SelectGroup[] = expenseCategories
    .map((category) => ({
      label: category.name,
      options: availableSubcategories
        .filter((s) => s.category_id === category.id)
        .map((sub) => ({
          value: sub.id,
          label: sub.name,
        })),
    }))
    .filter((group) => group.options.length > 0);

  useEffect(() => {
    if (initialData) {
      setSubcategoryId(initialData.subcategory_id);
      setAmount(initialData.amount.toString());
      setPeriod(initialData.period);
      setStartDate(initialData.start_date);
      setEndDate(initialData.end_date || "");
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!subcategoryId) {
      newErrors.subcategoryId = "Please select a subcategory";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const result = await onSubmit({
      subcategoryId,
      amount: parseFloat(amount),
      period,
      startDate,
      endDate: endDate || null,
    });

    if (!result.success) {
      setFormError(result.error || "Failed to save goal");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subcategory Selection */}
      {disableSubcategoryChange ? (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Subcategory</label>
          <div className="px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground">
            {subcategories.find((s) => s.id === subcategoryId)?.name || "Unknown"}
          </div>
        </div>
      ) : (
        <SimpleSelect
          label="Subcategory"
          groups={selectGroups}
          value={subcategoryId}
          onChange={(value) => {
            setSubcategoryId(value);
            setErrors({});
          }}
          placeholder="Select a subcategory..."
          error={errors.subcategoryId}
          disabled={isSubmitting || availableSubcategories.length === 0}
          helperText={
            availableSubcategories.length === 0
              ? "All expense subcategories already have goals"
              : undefined
          }
        />
      )}

      {/* Amount */}
      <Input
        type="number"
        label="Budget Amount"
        placeholder="0.00"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          setErrors({});
        }}
        error={errors.amount}
        fullWidth
        disabled={isSubmitting}
        min="0.01"
        step="0.01"
      />

      {/* Period */}
      <SimpleSelect
        label="Period"
        value={period}
        onChange={(value) => setPeriod(value as GoalPeriod)}
        options={PERIOD_OPTIONS}
        disabled={isSubmitting}
      />

      {/* Start Date */}
      <Input
        type="date"
        label="Start Date"
        value={startDate}
        onChange={(e) => {
          setStartDate(e.target.value);
          setErrors({});
        }}
        error={errors.startDate}
        fullWidth
        disabled={isSubmitting}
      />

      {/* End Date (Optional) */}
      <Input
        type="date"
        label="End Date (Optional)"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        helperText="Leave blank for an ongoing goal"
        fullWidth
        disabled={isSubmitting}
      />

      {/* Form Error */}
      {formError && (
        <div className="p-3 rounded-lg bg-foreground/20 border border-foreground text-foreground text-sm">
          {formError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
        {showCancel && onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
