// SavingGoalForm component - Form for creating/editing saving goals
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Account } from "@/types";

interface SavingGoalFormProps {
  accounts: Account[];
  initialData?: {
    name: string;
    target_amount?: number | null;
    target_date?: string | null;
    current_amount?: number;
    account_id?: string | null;
  };
  onSubmit: (data: {
    name: string;
    targetAmount?: number | null;
    targetDate?: string | null;
    currentAmount?: number;
    accountId?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function SavingGoalForm({
  accounts,
  initialData,
  onSubmit,
  submitLabel = "Save Goal",
  showCancel = false,
  onCancel,
}: SavingGoalFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount?.toString() || "");
  const [targetDate, setTargetDate] = useState(initialData?.target_date || "");
  const [currentAmount, setCurrentAmount] = useState(
    initialData?.current_amount?.toString() || "0"
  );
  const [accountId, setAccountId] = useState(initialData?.account_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    target?: string;
  }>({});

  // Only show asset accounts for linking
  const assetAccounts = accounts.filter((a) => a.type === "asset");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmount(initialData.target_amount?.toString() || "");
      setTargetDate(initialData.target_date || "");
      setCurrentAmount(initialData.current_amount?.toString() || "0");
      setAccountId(initialData.account_id || "");
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Goal name is required";
    }

    if (!targetAmount && !targetDate) {
      newErrors.target = "Either target amount or target date is required";
    }

    if (targetAmount && parseFloat(targetAmount) <= 0) {
      newErrors.target = "Target amount must be greater than 0";
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
      name: name.trim(),
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
      targetDate: targetDate || null,
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      accountId: accountId || null,
    });

    if (!result.success) {
      setFormError(result.error || "Failed to save goal");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Goal Name */}
      <Input
        type="text"
        label="Goal Name"
        placeholder="e.g., Emergency Fund, Vacation, New Car"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setErrors({});
        }}
        error={errors.name}
        fullWidth
        disabled={isSubmitting}
      />

      {/* Target Amount */}
      <Input
        type="number"
        label="Target Amount (Optional)"
        placeholder="0.00"
        value={targetAmount}
        onChange={(e) => {
          setTargetAmount(e.target.value);
          setErrors({});
        }}
        helperText="How much do you want to save?"
        fullWidth
        disabled={isSubmitting}
        min="0.01"
        step="0.01"
      />

      {/* Target Date */}
      <Input
        type="date"
        label="Target Date (Optional)"
        value={targetDate}
        onChange={(e) => {
          setTargetDate(e.target.value);
          setErrors({});
        }}
        helperText="When do you want to reach this goal?"
        fullWidth
        disabled={isSubmitting}
      />

      {errors.target && <p className="text-sm text-foreground">{errors.target}</p>}

      {/* Current Amount */}
      <Input
        type="number"
        label="Current Progress"
        placeholder="0.00"
        value={currentAmount}
        onChange={(e) => setCurrentAmount(e.target.value)}
        helperText="How much have you saved so far?"
        fullWidth
        disabled={isSubmitting}
        min="0"
        step="0.01"
      />

      {/* Link to Account (Optional) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Link to Account (Optional)
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-3 py-2 bg-card border border-border rounded-md text-white focus:border-foreground focus:ring-1 focus:ring-foreground"
          disabled={isSubmitting}
        >
          <option value="">No linked account</option>
          {assetAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Optionally track a specific account's balance for this goal
        </p>
      </div>

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
