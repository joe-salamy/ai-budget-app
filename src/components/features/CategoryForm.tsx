// CategoryForm component - Form for creating/editing categories
import { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import type { SelectOption } from "../ui/Select";
import type { CategoryType, Category } from "../../types";

interface CategoryFormProps {
  onSubmit: (data: {
    name: string;
    type: CategoryType;
  }) => Promise<{ success: boolean; error?: string }>;
  initialData?: Category;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  disableTypeChange?: boolean; // Disable type selection when editing
}

const categoryTypeOptions: SelectOption[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export function CategoryForm({
  onSubmit,
  initialData,
  submitLabel = "Add Category",
  showCancel = false,
  onCancel,
  disableTypeChange = false,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<CategoryType>(
    initialData?.type || "expense"
  );
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);

    const result = await onSubmit({
      name: name.trim(),
      type,
    });

    setSubmitting(false);

    if (result.success) {
      // Clear form if creating new category (not editing)
      if (!initialData) {
        setName("");
        setType("expense");
      }
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  const isSystemCategory = initialData?.is_system || false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Groceries, Salary"
        required
        disabled={isSystemCategory}
        helperText={
          isSystemCategory ? "System categories cannot be edited" : undefined
        }
      />

      <Select
        label="Category Type"
        options={categoryTypeOptions}
        value={type}
        onChange={(value) => setType(value as CategoryType)}
        required
        disabled={disableTypeChange || isSystemCategory}
        helperText={
          disableTypeChange
            ? "Type cannot be changed after creation (would break subcategory logic)"
            : undefined
        }
      />

      {error && <p className="text-sm text-foreground">{error}</p>}

      {!isSystemCategory && (
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
      )}
    </form>
  );
}
