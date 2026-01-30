// TransferModal component - Modal dialog for adding account transfers
import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import type { Account } from "../../types";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSubmit: (transfer: TransferData) => Promise<{ success: boolean; error?: string }>;
}

export interface TransferData {
  date: string;
  fromAccountId: string;
  toAccountId: string;
  name: string;
  amount: number;
  comment?: string;
}

export function TransferModal({ isOpen, onClose, accounts, onSubmit }: TransferModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter "To Account" options to exclude the selected "From Account"
  const toAccountOptions = useMemo(() => {
    return accounts.filter((acc) => acc.id !== fromAccountId);
  }, [accounts, fromAccountId]);

  // Reset form when modal opens
  const resetForm = () => {
    setDate(today);
    setFromAccountId("");
    setToAccountId("");
    setName("");
    setAmount("");
    setComment("");
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = "Date is required";
    }
    if (!fromAccountId) {
      newErrors.fromAccountId = "From account is required";
    }
    if (!toAccountId) {
      newErrors.toAccountId = "To account is required";
    }
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      newErrors.toAccountId = "Cannot transfer to the same account";
    }
    if (!name.trim()) {
      newErrors.name = "Description is required";
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        date,
        fromAccountId,
        toAccountId,
        name: name.trim(),
        amount: parseFloat(amount),
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        handleClose();
      } else {
        setErrors({ submit: result.error || "Failed to create transfer" });
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear toAccountId if it becomes invalid (same as fromAccountId)
  const handleFromAccountChange = (value: string) => {
    setFromAccountId(value);
    if (toAccountId === value) {
      setToAccountId("");
    }
    setErrors((prev) => {
      const { fromAccountId: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Transfer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {errors.submit && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Date */}
        <div className="space-y-1">
          <label htmlFor="transfer-date" className="text-sm font-medium text-foreground">
            Date
          </label>
          <input
            id="transfer-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setErrors((prev) => {
                const { date: _, ...rest } = prev;
                return rest;
              });
            }}
            className={`w-full px-3 py-2 bg-muted border rounded-md text-sm text-foreground ${
              errors.date ? "border-destructive" : "border-border"
            }`}
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>

        {/* From Account */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">From Account</label>
          <Select value={fromAccountId || undefined} onValueChange={handleFromAccountChange}>
            <SelectTrigger className={`w-full ${errors.fromAccountId ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select account..." />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fromAccountId && (
            <p className="text-xs text-destructive">{errors.fromAccountId}</p>
          )}
        </div>

        {/* To Account */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">To Account</label>
          <Select
            value={toAccountId || undefined}
            onValueChange={(value: string) => {
              setToAccountId(value);
              setErrors((prev) => {
                const { toAccountId: _, ...rest } = prev;
                return rest;
              });
            }}
            disabled={!fromAccountId}
          >
            <SelectTrigger className={`w-full ${errors.toAccountId ? "border-destructive" : ""}`}>
              <SelectValue
                placeholder={fromAccountId ? "Select account..." : "Select from account first"}
              />
            </SelectTrigger>
            <SelectContent>
              {toAccountOptions.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.toAccountId && <p className="text-xs text-destructive">{errors.toAccountId}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Description</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => {
                const { name: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="e.g., Transfer to savings"
            className={`w-full px-3 py-2 bg-muted border rounded-md text-sm text-foreground placeholder:text-muted-foreground ${
              errors.name ? "border-destructive" : "border-border"
            }`}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground pointer-events-none">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => {
                  const { amount: _, ...rest } = prev;
                  return rest;
                });
              }}
              placeholder="0.00"
              className={`w-full pl-7 pr-3 py-2 bg-muted border rounded-md text-sm text-foreground placeholder:text-muted-foreground ${
                errors.amount ? "border-destructive" : "border-border"
              }`}
            />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        {/* Comment */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Comment <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Add Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
