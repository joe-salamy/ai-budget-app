// SubcategoryForm component - Form for creating/editing subcategories
import { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SimpleSelect } from "../ui/SimpleSelect";
import type { SelectOption } from "../ui/SimpleSelect";
import type { Subcategory, Category } from "../../types";

interface SubcategoryFormProps {
  categories: Category[];
  onSubmit: (data: {
    name: string;
    categoryId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  initialData?: Subcategory;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function SubcategoryForm({
  categories,
  onSubmit,
  initialData,
  submitLabel = "Add Subcategory",
  showCancel = false,
  onCancel,
}: SubcategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category_id || ""
  );
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategoryId(initialData.category_id);
    }
  }, [initialData]);

  // Auto-select first category if none selected and categories available
  useEffect(() => {
    if (!categoryId && categories.length > 0 && !initialData) {
      // Select first non-system category, or first category if all are system
      const nonSystemCategory = categories.find((cat) => !cat.is_system);
      setCategoryId(nonSystemCategory?.id || categories[0].id);
    }
  }, [categories, categoryId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Subcategory name is required");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    setSubmitting(true);

    const result = await onSubmit({
      name: name.trim(),
      categoryId,
    });

    setSubmitting(false);

    if (result.success) {
      // Clear form if creating new subcategory (not editing)
      if (!initialData) {
        setName("");
        // Keep the same category selected for convenience
      }
    } else {
      setError(result.error || "Failed to save subcategory");
    }
  };

  const isSystemSubcategory = initialData?.is_system || false;

  // Create category options
  const categoryOptions: SelectOption[] = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.type})`,
    disabled: cat.is_system, // Can't add subcategories to system categories
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SimpleSelect
        label="Parent Category"
        options={categoryOptions}
        value={categoryId}
        onChange={(value) => setCategoryId(value)}
        placeholder="Select a category"
        required
        disabled={isSystemSubcategory}
        helperText={
          isSystemSubcategory
            ? "System subcategories cannot be edited"
            : "Select the category this subcategory belongs to"
        }
      />

      <Input
        label="Subcategory Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Rent, Gas, Freelance"
        required
        disabled={isSystemSubcategory}
      />

      {error && <p className="text-sm text-foreground">{error}</p>}

      {!isSystemSubcategory && (
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
