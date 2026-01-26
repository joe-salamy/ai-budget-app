// SetupPage - 4-step wizard for setting up accounts, categories, subcategories, and spending goals
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useGoals } from "../hooks/useGoals";
import { AccountForm } from "../components/features/AccountForm";
import { CategoryForm } from "../components/features/CategoryForm";
import { SubcategoryForm } from "../components/features/SubcategoryForm";
import { SpendingGoalForm } from "../components/features/SpendingGoalForm";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Trash2, Pencil, Target, Plus } from "lucide-react";
import type { Category, Subcategory, GoalPeriod } from "../types";
import type { SpendingGoalWithDetails } from "../services/goals";

function SetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [editingAccount, setEditingAccount] = useState<{
    id: string;
    name: string;
    type: string;
    initial_balance: number;
  } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAccountData, setEditAccountData] = useState({
    name: "",
    type: "asset" as "asset" | "liability",
    initialBalance: 0,
  });
  const [editingSpendingGoal, setEditingSpendingGoal] = useState<SpendingGoalWithDetails | null>(
    null
  );

  const {
    accounts,
    loading: accountsLoading,
    addAccount,
    editAccount,
    removeAccount,
  } = useAccounts();
  const {
    categories,
    subcategories,
    loading: categoriesLoading,
    addCategory,
    editCategory,
    removeCategory,
    addSubcategory,
    editSubcategory,
    removeSubcategory,
    getSubcategoriesByCategory,
  } = useCategories();
  const {
    spendingGoals,
    spendingGoalsLoading,
    addSpendingGoal,
    editSpendingGoal,
    removeSpendingGoal,
  } = useGoals();

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  const handleEditAccount = (account: {
    id: string;
    name: string;
    type: string;
    initial_balance: number;
  }) => {
    setEditingAccount(account);
    setEditAccountData({
      name: account.name,
      type: account.type as "asset" | "liability",
      initialBalance: account.initial_balance,
    });
  };

  const handleSaveAccount = async () => {
    if (!editingAccount || !editAccountData.name.trim()) return;
    const result = await editAccount(editingAccount.id, {
      name: editAccountData.name.trim(),
      type: editAccountData.type,
      initial_balance: editAccountData.initialBalance,
    });
    if (result.success) {
      setEditingAccount(null);
      setEditAccountData({ name: "", type: "asset", initialBalance: 0 });
    }
  };

  const handleCancelAccountEdit = () => {
    setEditingAccount(null);
    setEditAccountData({ name: "", type: "asset", initialBalance: 0 });
  };

  const handleDeleteAccount = async (id: string) => {
    if (
      window.confirm("Are you sure you want to delete this account? This action cannot be undone.")
    ) {
      await removeAccount(id);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const subsForCategory = getSubcategoriesByCategory(id);
    if (subsForCategory.length > 0) {
      alert(
        `Cannot delete category "${name}". It has ${subsForCategory.length} subcategories. Delete subcategories first.`
      );
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete the category "${name}"? This action cannot be undone.`
      )
    ) {
      await removeCategory(id);
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the subcategory "${name}"? This action cannot be undone.`
      )
    ) {
      await removeSubcategory(id);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setEditName(subcategory.name);
    setEditCategoryId(subcategory.category_id);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editName.trim()) return;
    const result = await editCategory(editingCategory.id, { name: editName.trim() });
    if (result.success) {
      setEditingCategory(null);
      setEditName("");
    }
  };

  const handleSaveSubcategory = async () => {
    if (!editingSubcategory || !editName.trim() || !editCategoryId) return;
    const result = await editSubcategory(editingSubcategory.id, {
      name: editName.trim(),
      category_id: editCategoryId,
    });
    if (result.success) {
      setEditingSubcategory(null);
      setEditName("");
      setEditCategoryId("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditName("");
    setEditCategoryId("");
  };

  const handleDeleteSpendingGoal = async (id: string, name: string) => {
    if (window.confirm(`Delete the spending goal for "${name}"?`)) {
      await removeSpendingGoal(id);
    }
  };

  // Helper functions for formatting
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPeriod = (period: GoalPeriod): string => {
    const labels: Record<GoalPeriod, string> = {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
    };
    return labels[period] || period;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter out system categories/subcategories for display
  const userCategories = categories.filter((cat) => !cat.is_system);
  const userSubcategories = subcategories.filter((sub) => !sub.is_system);

  // Get subcategory IDs that already have goals
  const existingGoalSubcategoryIds = spendingGoals.map((g) => g.subcategory_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { step: 1, label: "Accounts" },
          { step: 2, label: "Categories" },
          { step: 3, label: "Subcategories" },
          { step: 4, label: "Goals" },
        ].map(({ step, label }) => (
          <button
            key={step}
            onClick={() => setCurrentStep(step)}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              step === currentStep
                ? "bg-card border-foreground shadow-lg"
                : "bg-card border-border hover:border-foreground/50 hover:shadow-md"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                step === currentStep
                  ? "bg-foreground text-background"
                  : step < currentStep
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            <div
              className={`text-base font-semibold ${
                step === currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* Step 1: Accounts */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Your Accounts</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Add bank accounts, credit cards, investment accounts, or any other accounts you want
              to track
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Form */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Create New Account</h3>
              <AccountForm
                onSubmit={async (data) => {
                  const result = await addAccount(data.name, data.type, data.initialBalance);
                  return result;
                }}
                submitLabel="Add Account"
              />
            </div>

            {/* Accounts List */}
            {accountsLoading ? (
              <p className="text-muted-foreground">Loading accounts...</p>
            ) : accounts.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                  Your Accounts ({accounts.length})
                </h3>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between bg-card p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-gray-100">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.type === "asset" ? "Asset" : "Liability"} • Initial Balance: $
                          {account.initial_balance.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAccount(account)}
                          className="text-foreground hover:text-foreground hover:bg-foreground/20"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-foreground hover:text-foreground hover:bg-foreground/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No accounts yet. Add your first account above.
              </p>
            )}

            {/* Navigation */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="primary" onClick={handleNextStep} disabled={accounts.length === 0}>
                Next: Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Categories */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Categories</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Organize your transactions with income and expense categories
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Form */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Create New Category</h3>
              <CategoryForm
                onSubmit={async (data) => {
                  const result = await addCategory(data.name, data.type);
                  return result;
                }}
                submitLabel="Add Category"
              />
            </div>

            {/* Categories List */}
            {categoriesLoading ? (
              <p className="text-muted-foreground">Loading categories...</p>
            ) : userCategories.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                  Your Categories ({userCategories.length})
                </h3>
                <div className="space-y-2">
                  {userCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between bg-card p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-gray-100">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.type === "income" ? "Income" : "Expense"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="text-foreground hover:text-foreground hover:bg-foreground/20"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="text-foreground hover:text-foreground hover:bg-foreground/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No categories yet. Add your first category above.
              </p>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={userCategories.length === 0}
              >
                Next: Subcategories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Subcategories */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Add Subcategories</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Add specific subcategories to further organize your spending and income
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subcategory Form */}
            {categories.length > 0 ? (
              <div className="bg-card p-4 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Create New Subcategory</h3>
                <SubcategoryForm
                  categories={categories}
                  onSubmit={async (data) => {
                    const result = await addSubcategory(data.name, data.categoryId);
                    return result;
                  }}
                  submitLabel="Add Subcategory"
                />
              </div>
            ) : (
              <p className="text-muted-foreground">Please create at least one category first.</p>
            )}

            {/* Subcategories List */}
            {categoriesLoading ? (
              <p className="text-muted-foreground">Loading subcategories...</p>
            ) : userSubcategories.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                  Your Subcategories ({userSubcategories.length})
                </h3>
                <div className="space-y-2">
                  {userSubcategories.map((subcategory) => {
                    const category = categories.find((cat) => cat.id === subcategory.category_id);
                    return (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between bg-card p-4 rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium text-gray-100">{subcategory.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Category: {category?.name || "Unknown"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubcategory(subcategory)}
                            className="text-foreground hover:text-foreground hover:bg-foreground/20"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteSubcategory(subcategory.id, subcategory.name)
                            }
                            className="text-foreground hover:text-foreground hover:bg-foreground/20"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No subcategories yet. Add your first subcategory above.
              </p>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNextStep}>
                Next: Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Spending Goals */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Set Spending Goals</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Set budget limits for expense categories to track your spending
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create New Spending Goal Form - Always Visible */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Create New Spending Goal
              </h3>
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
                  return result;
                }}
                submitLabel="Create Goal"
              />
            </div>

            {/* Spending Goals List */}
            {spendingGoalsLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : spendingGoals.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                  Your Spending Goals ({spendingGoals.length})
                </h3>
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
                      {spendingGoals.map((goal) => (
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
                                onClick={() => setEditingSpendingGoal(goal)}
                                className="text-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteSpendingGoal(goal.id, goal.subcategory_name)
                                }
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
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No spending goals set yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the form above to create your first spending goal
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button variant="primary" onClick={handleFinish}>
                Finish Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              id="categoryName"
              label="Category Name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter category name"
              fullWidth
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCategory} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={!!editingSubcategory} onOpenChange={() => handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              id="subcategoryName"
              label="Subcategory Name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter subcategory name"
              fullWidth
            />
            <div>
              <label
                htmlFor="subcategoryCategory"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Category
              </label>
              <select
                id="subcategoryCategory"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSubcategory}
              disabled={!editName.trim() || !editCategoryId}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => handleCancelAccountEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              id="accountName"
              label="Account Name"
              type="text"
              value={editAccountData.name}
              onChange={(e) => setEditAccountData({ ...editAccountData, name: e.target.value })}
              placeholder="Enter account name"
              fullWidth
            />
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-foreground mb-1.5">
                Account Type
              </label>
              <select
                id="accountType"
                value={editAccountData.type}
                onChange={(e) =>
                  setEditAccountData({
                    ...editAccountData,
                    type: e.target.value as "asset" | "liability",
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
              </select>
            </div>
            <Input
              id="accountBalance"
              label="Initial Balance"
              type="number"
              step="0.01"
              value={editAccountData.initialBalance}
              onChange={(e) =>
                setEditAccountData({
                  ...editAccountData,
                  initialBalance: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              fullWidth
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAccountEdit}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAccount}
              disabled={!editAccountData.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Spending Goal Dialog */}
      <Dialog open={!!editingSpendingGoal} onOpenChange={() => setEditingSpendingGoal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Spending Goal
              {editingSpendingGoal && ` for "${editingSpendingGoal.subcategory_name}"`}
            </DialogTitle>
          </DialogHeader>
          <div>
            {editingSpendingGoal && (
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SetupPage;
