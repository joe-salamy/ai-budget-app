// AccountForm component - Form for creating/editing accounts
import { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import type { SelectOption } from "../ui/Select";
import type { AccountType, Account } from "../../types";

interface AccountFormProps {
  onSubmit: (data: {
    name: string;
    type: AccountType;
    initialBalance: number;
  }) => Promise<{ success: boolean; error?: string }>;
  initialData?: Account;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

const accountTypeOptions: SelectOption[] = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
];

export function AccountForm({
  onSubmit,
  initialData,
  submitLabel = "Add Account",
  showCancel = false,
  onCancel,
}: AccountFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<AccountType>(
    initialData?.type || "asset"
  );
  const [initialBalance, setInitialBalance] = useState<string>(
    initialData?.initial_balance.toString() || "0"
  );
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setInitialBalance(initialData.initial_balance.toString());
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    if (isNaN(parseFloat(initialBalance))) {
      setError("Initial balance must be a valid number");
      return;
    }

    setSubmitting(true);

    const result = await onSubmit({
      name: name.trim(),
      type,
      initialBalance: parseFloat(initialBalance),
    });

    setSubmitting(false);

    if (result.success) {
      // Clear form if creating new account (not editing)
      if (!initialData) {
        setName("");
        setType("asset");
        setInitialBalance("0");
      }
    } else {
      setError(result.error || "Failed to save account");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Account Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Checking Account, Credit Card"
        required
      />

      <Select
        label="Account Type"
        options={accountTypeOptions}
        value={type}
        onChange={(value) => setType(value as AccountType)}
        required
      />

      <Input
        label="Initial Balance"
        type="number"
        step="0.01"
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
        placeholder="0.00"
        helperText="The starting balance for this account"
        required
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving..." : submitLabel}
        </Button>
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
