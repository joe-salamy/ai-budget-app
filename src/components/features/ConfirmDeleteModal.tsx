// ConfirmDeleteModal component - Modal for confirming transaction deletion
import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  itemType?: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  itemCount,
  itemType = "transaction",
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const plural = itemCount !== 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Delete ${itemType}${plural ? "s" : ""}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-foreground/10">
          <svg
            className="w-6 h-6 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <p className="text-center text-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-100">
            {itemCount} {itemType}
            {plural ? "s" : ""}
          </span>
          ?
        </p>

        <p className="text-center text-sm text-muted-foreground">This action cannot be undone.</p>

        {error && <p className="text-sm text-foreground text-center">{error}</p>}
      </div>
    </Modal>
  );
}
