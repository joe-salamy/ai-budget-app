// GoalsPage - Manage spending and saving goals
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGoals } from "@/hooks/useGoals";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { SpendingGoalForm } from "@/components/features/SpendingGoalForm";
import { SavingGoalForm } from "@/components/features/SavingGoalForm";
import type { SpendingGoalWithDetails } from "@/services/goals";
import type { SavingGoalWithDetails } from "@/services/goals";
import type { GoalPeriod } from "@/types";
import {
  Target,
  PiggyBank,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPeriod(period: GoalPeriod): string {
  const labels: Record<GoalPeriod, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
  };
  return labels[period] || period;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSavingProgressColor(percent: number): string {
  if (percent >= 100) return "bg-foreground";
  if (percent >= 50) return "bg-foreground";
  return "bg-muted";
}

// ============== SPENDING GOALS SECTION ==============

interface SpendingGoalsSectionProps {
  goals: SpendingGoalWithDetails[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (goal: SpendingGoalWithDetails) => void;
  onDelete: (id: string, name: string) => void;
}

function SpendingGoalsSection({
  goals,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: SpendingGoalsSectionProps) {
  // TODO: Get actual spending progress for each goal
  // For now, we'll show the goal info without current spending

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/20 border border-foreground flex items-center justify-center">
              <Target className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Spending Goals</CardTitle>
              <CardDescription>Set budgets for expense categories</CardDescription>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No spending goals set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a spending goal to track your budget
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Subcategory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Date Range
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {goals.map((goal) => (
                  <tr key={goal.id} className="hover:bg-muted">
                    <td className="px-4 py-4 text-sm text-foreground font-medium">
                      {goal.subcategory_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {goal.category_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-foreground font-medium">
                      {formatCurrency(goal.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span className="px-2 py-1 bg-muted rounded text-muted-foreground text-xs">
                        {formatPeriod(goal.period)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-muted-foreground">
                      {formatDate(goal.start_date)}
                      {goal.end_date ? ` - ${formatDate(goal.end_date)}` : " - Ongoing"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(goal)}
                          className="text-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(goal.id, goal.subcategory_name)}
                          className="text-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============== SAVING GOALS SECTION ==============

interface SavingGoalsSectionProps {
  goals: SavingGoalWithDetails[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (goal: SavingGoalWithDetails) => void;
  onDelete: (id: string, name: string) => void;
  onToggleComplete: (goal: SavingGoalWithDetails) => void;
  onAddAmount: (goal: SavingGoalWithDetails) => void;
}

function SavingGoalsSection({
  goals,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddAmount,
}: SavingGoalsSectionProps) {
  const activeGoals = goals.filter((g) => !g.completed_at);
  const completedGoals = goals.filter((g) => g.completed_at);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/20 border border-foreground flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Saving Goals</CardTitle>
              <CardDescription>Track progress towards your savings targets</CardDescription>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-muted rounded-lg"></div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No saving goals set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a saving goal to track your progress
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">
                  Active Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => {
                    const percent =
                      goal.target_amount && goal.target_amount > 0
                        ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                        : 0;

                    return (
                      <div
                        key={goal.id}
                        className="p-4 bg-muted rounded-lg border border-border hover:border-foreground hover:bg-muted"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onToggleComplete(goal)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Mark as complete"
                            >
                              <Circle size={18} />
                            </button>
                            <h4 className="font-medium text-foreground">{goal.name}</h4>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAddAmount(goal)}
                              className="text-foreground hover:text-foreground hover:bg-muted p-1"
                              title="Add to savings"
                            >
                              <DollarSign size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(goal)}
                              className="text-foreground hover:text-foreground hover:bg-muted p-1"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(goal.id, goal.name)}
                              className="text-foreground hover:text-foreground hover:bg-muted p-1"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {goal.target_amount && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                {formatCurrency(goal.current_amount)}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(goal.target_amount)}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getSavingProgressColor(percent)}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 text-right">
                              {percent.toFixed(0)}% complete
                            </div>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {goal.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Target: {formatDate(goal.target_date)}</span>
                            </div>
                          )}
                          {goal.account_name && (
                            <div className="flex items-center gap-1">
                              <TrendingUp size={12} />
                              <span>Linked: {goal.account_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">
                  Completed Goals ({completedGoals.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="p-4 bg-muted rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleComplete(goal)}
                            className="text-foreground hover:text-muted-foreground"
                            title="Mark as incomplete"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <div>
                            <h4 className="font-medium text-muted-foreground line-through">
                              {goal.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {goal.target_amount
                                ? `Saved ${formatCurrency(goal.current_amount)}`
                                : "Completed"}
                              {goal.completed_at && ` on ${formatDate(goal.completed_at)}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(goal.id, goal.name)}
                          className="text-foreground hover:text-foreground hover:bg-foreground/20 p-1"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============== ADD AMOUNT MODAL ==============

interface AddAmountModalProps {
  goal: SavingGoalWithDetails;
  onSubmit: (amount: number) => Promise<void>;
  onClose: () => void;
}

function AddAmountModal({ goal, onSubmit, onClose }: AddAmountModalProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    await onSubmit(parseFloat(amount));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add to "{goal.name}"</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Current progress: {formatCurrency(goal.current_amount)}
          {goal.target_amount && ` of ${formatCurrency(goal.target_amount)}`}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Amount to Add
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:border-foreground focus:ring-1 focus:ring-ring"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
              isLoading={isSubmitting}
            >
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

function GoalsPage() {
  const {
    spendingGoals,
    spendingGoalsLoading,
    savingGoals,
    savingGoalsLoading,
    addSpendingGoal,
    editSpendingGoal,
    removeSpendingGoal,
    addSavingGoal,
    editSavingGoal,
    removeSavingGoal,
    markSavingGoalComplete,
    markSavingGoalIncomplete,
    addAmountToSavingGoal,
  } = useGoals();

  const { categories, subcategories } = useCategories();
  const { accounts } = useAccounts();

  // Modals/forms state
  const [showAddSpendingGoal, setShowAddSpendingGoal] = useState(false);
  const [editingSpendingGoal, setEditingSpendingGoal] = useState<SpendingGoalWithDetails | null>(
    null
  );
  const [showAddSavingGoal, setShowAddSavingGoal] = useState(false);
  const [editingSavingGoal, setEditingSavingGoal] = useState<SavingGoalWithDetails | null>(null);
  const [addAmountGoal, setAddAmountGoal] = useState<SavingGoalWithDetails | null>(null);

  // Get subcategory IDs that already have goals
  const existingGoalSubcategoryIds = spendingGoals.map((g) => g.subcategory_id);

  // Handlers
  const handleDeleteSpendingGoal = async (id: string, name: string) => {
    if (window.confirm(`Delete the spending goal for "${name}"?`)) {
      await removeSpendingGoal(id);
    }
  };

  const handleDeleteSavingGoal = async (id: string, name: string) => {
    if (window.confirm(`Delete the saving goal "${name}"?`)) {
      await removeSavingGoal(id);
    }
  };

  const handleToggleSavingGoalComplete = async (goal: SavingGoalWithDetails) => {
    if (goal.completed_at) {
      await markSavingGoalIncomplete(goal.id);
    } else {
      await markSavingGoalComplete(goal.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Budget Goals</h1>
        <p className="text-muted-foreground mt-2">
          Set spending limits and track your savings progress
        </p>
      </div>

      {/* Spending Goals Section */}
      <SpendingGoalsSection
        goals={spendingGoals}
        loading={spendingGoalsLoading}
        onAdd={() => {
          setShowAddSpendingGoal(true);
          setEditingSpendingGoal(null);
        }}
        onEdit={(goal) => {
          setEditingSpendingGoal(goal);
          setShowAddSpendingGoal(false);
        }}
        onDelete={handleDeleteSpendingGoal}
      />

      {/* Add Spending Goal Form */}
      {showAddSpendingGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Add Spending Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingGoalForm
              subcategories={subcategories}
              categories={categories}
              existingGoalSubcategoryIds={existingGoalSubcategoryIds}
              onSubmit={async (data) => {
                const result = await addSpendingGoal(
                  data.subcategoryId,
                  data.amount,
                  data.period,
                  data.startDate,
                  data.endDate
                );
                if (result.success) {
                  setShowAddSpendingGoal(false);
                }
                return result;
              }}
              submitLabel="Create Goal"
              showCancel
              onCancel={() => setShowAddSpendingGoal(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Spending Goal Form */}
      {editingSpendingGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Spending Goal</CardTitle>
            <CardDescription>
              Editing goal for "{editingSpendingGoal.subcategory_name}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingGoalForm
              subcategories={subcategories}
              categories={categories}
              existingGoalSubcategoryIds={existingGoalSubcategoryIds}
              initialData={{
                subcategory_id: editingSpendingGoal.subcategory_id,
                amount: editingSpendingGoal.amount,
                period: editingSpendingGoal.period,
                start_date: editingSpendingGoal.start_date,
                end_date: editingSpendingGoal.end_date,
              }}
              onSubmit={async (data) => {
                const result = await editSpendingGoal(editingSpendingGoal.id, {
                  amount: data.amount,
                  period: data.period,
                  start_date: data.startDate,
                  end_date: data.endDate,
                });
                if (result.success) {
                  setEditingSpendingGoal(null);
                }
                return result;
              }}
              submitLabel="Save Changes"
              showCancel
              onCancel={() => setEditingSpendingGoal(null)}
              disableSubcategoryChange
            />
          </CardContent>
        </Card>
      )}

      {/* Saving Goals Section */}
      <SavingGoalsSection
        goals={savingGoals}
        loading={savingGoalsLoading}
        onAdd={() => {
          setShowAddSavingGoal(true);
          setEditingSavingGoal(null);
        }}
        onEdit={(goal) => {
          setEditingSavingGoal(goal);
          setShowAddSavingGoal(false);
        }}
        onDelete={handleDeleteSavingGoal}
        onToggleComplete={handleToggleSavingGoalComplete}
        onAddAmount={(goal) => setAddAmountGoal(goal)}
      />

      {/* Add Saving Goal Form */}
      {showAddSavingGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Add Saving Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingGoalForm
              accounts={accounts}
              onSubmit={async (data) => {
                const result = await addSavingGoal(data.name, {
                  targetAmount: data.targetAmount,
                  targetDate: data.targetDate,
                  currentAmount: data.currentAmount,
                  accountId: data.accountId,
                });
                if (result.success) {
                  setShowAddSavingGoal(false);
                }
                return result;
              }}
              submitLabel="Create Goal"
              showCancel
              onCancel={() => setShowAddSavingGoal(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Saving Goal Form */}
      {editingSavingGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Saving Goal</CardTitle>
            <CardDescription>Editing "{editingSavingGoal.name}"</CardDescription>
          </CardHeader>
          <CardContent>
            <SavingGoalForm
              accounts={accounts}
              initialData={{
                name: editingSavingGoal.name,
                target_amount: editingSavingGoal.target_amount,
                target_date: editingSavingGoal.target_date,
                current_amount: editingSavingGoal.current_amount,
                account_id: editingSavingGoal.account_id,
              }}
              onSubmit={async (data) => {
                const result = await editSavingGoal(editingSavingGoal.id, {
                  name: data.name,
                  target_amount: data.targetAmount,
                  target_date: data.targetDate,
                  current_amount: data.currentAmount,
                  account_id: data.accountId,
                });
                if (result.success) {
                  setEditingSavingGoal(null);
                }
                return result;
              }}
              submitLabel="Save Changes"
              showCancel
              onCancel={() => setEditingSavingGoal(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Add Amount Modal */}
      {addAmountGoal && (
        <AddAmountModal
          goal={addAmountGoal}
          onSubmit={async (amount) => {
            await addAmountToSavingGoal(addAmountGoal.id, amount);
          }}
          onClose={() => setAddAmountGoal(null)}
        />
      )}
    </div>
  );
}

export default GoalsPage;
