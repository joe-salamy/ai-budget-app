// SetupPage - 3-step wizard for setting up accounts, categories, and subcategories (with goals)
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { AccountForm } from "../components/features/AccountForm";
import { CategoryForm } from "../components/features/CategoryForm";
import { SubcategoryForm } from "../components/features/SubcategoryForm";
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
import { Trash2, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Category, Subcategory } from "../types";

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
  const [editMonthlyGoal, setEditMonthlyGoal] = useState("");
  const [editAccountData, setEditAccountData] = useState({
    name: "",
    type: "asset" as "asset" | "liability",
    initialBalance: 0,
  });

  // Sorting state for each table
  const [accountsSortColumn, setAccountsSortColumn] = useState<
    "name" | "type" | "current_balance" | null
  >(null);
  const [accountsSortDirection, setAccountsSortDirection] = useState<"asc" | "desc">("asc");
  const [categoriesSortColumn, setCategoriesSortColumn] = useState<"name" | "type" | null>(null);
  const [categoriesSortDirection, setCategoriesSortDirection] = useState<"asc" | "desc">("asc");
  const [subcategoriesSortColumn, setSubcategoriesSortColumn] = useState<
    "name" | "category" | "type" | "monthly_goal" | null
  >(null);
  const [subcategoriesSortDirection, setSubcategoriesSortDirection] = useState<"asc" | "desc">(
    "asc"
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

  const handleNextStep = () => {
    if (currentStep < 3) {
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
    setEditMonthlyGoal(subcategory.monthly_goal?.toString() || "");
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
      monthly_goal: editMonthlyGoal ? parseFloat(editMonthlyGoal) : null,
    });
    if (result.success) {
      setEditingSubcategory(null);
      setEditName("");
      setEditCategoryId("");
      setEditMonthlyGoal("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditName("");
    setEditCategoryId("");
    setEditMonthlyGoal("");
  };

  // Helper function for formatting currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Filter out system categories/subcategories for display
  const userCategories = categories.filter((cat) => !cat.is_system);
  const userSubcategories = subcategories.filter((sub) => !sub.is_system);

  // Sorting handler functions
  const handleAccountsSort = (column: "name" | "type" | "current_balance") => {
    if (accountsSortColumn === column) {
      setAccountsSortDirection(accountsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setAccountsSortColumn(column);
      setAccountsSortDirection("asc");
    }
  };

  const handleCategoriesSort = (column: "name" | "type") => {
    if (categoriesSortColumn === column) {
      setCategoriesSortDirection(categoriesSortDirection === "asc" ? "desc" : "asc");
    } else {
      setCategoriesSortColumn(column);
      setCategoriesSortDirection("asc");
    }
  };

  const handleSubcategoriesSort = (column: "name" | "category" | "type" | "monthly_goal") => {
    if (subcategoriesSortColumn === column) {
      setSubcategoriesSortDirection(subcategoriesSortDirection === "asc" ? "desc" : "asc");
    } else {
      setSubcategoriesSortColumn(column);
      setSubcategoriesSortDirection("asc");
    }
  };

  // Sorted data using useMemo
  const sortedAccounts = useMemo(() => {
    if (!accountsSortColumn) return accounts;

    return [...accounts].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (accountsSortColumn === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (accountsSortColumn === "type") {
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
      } else if (accountsSortColumn === "current_balance") {
        aValue = a.current_balance;
        bValue = b.current_balance;
      }

      if (aValue < bValue) return accountsSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return accountsSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [accounts, accountsSortColumn, accountsSortDirection]);

  const sortedCategories = useMemo(() => {
    if (!categoriesSortColumn) return userCategories;

    return [...userCategories].sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      if (categoriesSortColumn === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (categoriesSortColumn === "type") {
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
      }

      if (aValue < bValue) return categoriesSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return categoriesSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [userCategories, categoriesSortColumn, categoriesSortDirection]);

  const sortedSubcategories = useMemo(() => {
    if (!subcategoriesSortColumn) return userSubcategories;

    return [...userSubcategories].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (subcategoriesSortColumn === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (subcategoriesSortColumn === "category") {
        const aCat = categories.find((cat) => cat.id === a.category_id);
        const bCat = categories.find((cat) => cat.id === b.category_id);
        aValue = aCat?.name.toLowerCase() || "";
        bValue = bCat?.name.toLowerCase() || "";
      } else if (subcategoriesSortColumn === "type") {
        const aCat = categories.find((cat) => cat.id === a.category_id);
        const bCat = categories.find((cat) => cat.id === b.category_id);
        aValue = aCat?.type.toLowerCase() || "";
        bValue = bCat?.type.toLowerCase() || "";
      } else if (subcategoriesSortColumn === "monthly_goal") {
        aValue = a.monthly_goal || 0;
        bValue = b.monthly_goal || 0;
      }

      if (aValue < bValue) return subcategoriesSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return subcategoriesSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [userSubcategories, subcategoriesSortColumn, subcategoriesSortDirection, categories]);

  // Helper for rendering sort icons
  const renderSortIcon = (
    column: string,
    currentColumn: string | null,
    direction: "asc" | "desc"
  ) => {
    if (currentColumn !== column) {
      return <ArrowUpDown size={14} className="inline ml-1 opacity-50" />;
    }
    return direction === "asc" ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { step: 1, label: "Accounts" },
          { step: 2, label: "Categories" },
          { step: 3, label: "Subcategories + Budget" },
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleAccountsSort("name")}
                        >
                          Account
                          {renderSortIcon("name", accountsSortColumn, accountsSortDirection)}
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleAccountsSort("type")}
                        >
                          Type
                          {renderSortIcon("type", accountsSortColumn, accountsSortDirection)}
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleAccountsSort("current_balance")}
                        >
                          Current Balance
                          {renderSortIcon(
                            "current_balance",
                            accountsSortColumn,
                            accountsSortDirection
                          )}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-muted">
                          <td className="px-4 py-4 text-sm text-foreground font-medium">
                            {account.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {account.type === "asset" ? "Asset" : "Liability"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-foreground">
                            {formatCurrency(account.current_balance)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAccount(account)}
                                className="text-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccount(account.id)}
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleCategoriesSort("name")}
                        >
                          Category
                          {renderSortIcon("name", categoriesSortColumn, categoriesSortDirection)}
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleCategoriesSort("type")}
                        >
                          Type
                          {renderSortIcon("type", categoriesSortColumn, categoriesSortDirection)}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-muted">
                          <td className="px-4 py-4 text-sm text-foreground font-medium">
                            {category.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {category.type === "income" ? "Income" : "Expense"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                                className="text-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
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

      {/* Step 3: Subcategories + Budget */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Create Subcategories + Budget</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Add specific subcategories and set monthly goals for your spending and income
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
                    const result = await addSubcategory(
                      data.name,
                      data.categoryId,
                      data.monthlyGoal
                    );
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
                  Your Subcategories ({userSubcategories.length}) + Budget
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleSubcategoriesSort("name")}
                        >
                          Subcategory
                          {renderSortIcon(
                            "name",
                            subcategoriesSortColumn,
                            subcategoriesSortDirection
                          )}
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleSubcategoriesSort("category")}
                        >
                          Category
                          {renderSortIcon(
                            "category",
                            subcategoriesSortColumn,
                            subcategoriesSortDirection
                          )}
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleSubcategoriesSort("type")}
                        >
                          Type
                          {renderSortIcon(
                            "type",
                            subcategoriesSortColumn,
                            subcategoriesSortDirection
                          )}
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                          onClick={() => handleSubcategoriesSort("monthly_goal")}
                        >
                          Monthly Goal
                          {renderSortIcon(
                            "monthly_goal",
                            subcategoriesSortColumn,
                            subcategoriesSortDirection
                          )}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedSubcategories.map((subcategory) => {
                        const category = categories.find(
                          (cat) => cat.id === subcategory.category_id
                        );
                        return (
                          <tr key={subcategory.id} className="hover:bg-muted">
                            <td className="px-4 py-4 text-sm text-foreground font-medium">
                              {subcategory.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {category?.name || "Unknown"}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {category?.type === "income" ? "Income" : "Expense"}
                            </td>
                            <td className="px-4 py-4 text-sm text-right text-foreground">
                              {subcategory.monthly_goal
                                ? formatCurrency(subcategory.monthly_goal)
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSubcategory(subcategory)}
                                  className="text-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteSubcategory(subcategory.id, subcategory.name)
                                  }
                                  className="text-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            <Input
              id="subcategoryMonthlyGoal"
              label="Monthly Goal (Optional)"
              type="number"
              step="0.01"
              min="0"
              value={editMonthlyGoal}
              onChange={(e) => setEditMonthlyGoal(e.target.value)}
              placeholder="0.00"
              fullWidth
            />
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
              <label
                htmlFor="accountType"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
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
    </div>
  );
}

export default SetupPage;
