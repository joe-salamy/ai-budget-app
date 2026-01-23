// BulkEditModal component - Modal for bulk editing transaction subcategories
import { useState, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { SimpleSelect } from "../ui/SimpleSelect";
import type { SelectOption } from "../ui/SimpleSelect";
import type { Category, Subcategory } from "../../types";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  categories: Category[];
  subcategories: Subcategory[];
  onConfirm: (subcategoryId: string | null) => Promise<void>;
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  categories,
  subcategories,
  onConfirm,
}: BulkEditModalProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build subcategory options grouped by category
  const subcategoryOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [];

    // Group subcategories by category
    const grouped = new Map<string, Subcategory[]>();
    subcategories.forEach((sub) => {
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
  }, [categories, subcategories]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(selectedSubcategory || null);
      setSelectedSubcategory("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSubcategory("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Subcategory"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!selectedSubcategory}
          >
            Update {selectedCount} Transaction{selectedCount !== 1 ? "s" : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-foreground">
          Select a subcategory to apply to{" "}
          <span className="font-semibold text-gray-100">
            {selectedCount} transaction{selectedCount !== 1 ? "s" : ""}
          </span>
          .
        </p>

        <SimpleSelect
          label="New Subcategory"
          options={subcategoryOptions}
          value={selectedSubcategory}
          onChange={setSelectedSubcategory}
          placeholder="Select subcategory"
        />

        {error && (
          <p className="text-sm text-foreground">{error}</p>
        )}
      </div>
    </Modal>
  );
}
