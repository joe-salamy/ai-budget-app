// SetupPage - 3-step wizard for setting up accounts, categories, and subcategories
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { AccountForm } from "../components/features/AccountForm";
import { CategoryForm } from "../components/features/CategoryForm";
import { SubcategoryForm } from "../components/features/SubcategoryForm";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Trash2, Pencil } from "lucide-react";
import type { Category, Subcategory } from "../types";

function SetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editName, setEditName] = useState("");
  const { accounts, loading: accountsLoading, addAccount, removeAccount } = useAccounts();
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
    if (!editingSubcategory || !editName.trim()) return;
    const result = await editSubcategory(editingSubcategory.id, { name: editName.trim() });
    if (result.success) {
      setEditingSubcategory(null);
      setEditName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditName("");
  };

  // Filter out system categories/subcategories for display
  const userCategories = categories.filter((cat) => !cat.is_system);
  const userSubcategories = subcategories.filter((sub) => !sub.is_system);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Welcome! Let's Set Up Your Budget</h1>
        <p className="mt-2 text-muted-foreground">
          Follow these 3 steps to get started with tracking your finances
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === currentStep
                    ? "bg-foreground text-white"
                    : step < currentStep
                      ? "bg-foreground text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              <div className="text-sm">
                <div
                  className={
                    step === currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                  }
                >
                  Step {step}
                </div>
                <div className="text-muted-foreground text-xs">
                  {step === 1 && "Accounts"}
                  {step === 2 && "Categories"}
                  {step === 3 && "Subcategories"}
                </div>
              </div>
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-4 ${step < currentStep ? "bg-foreground" : "bg-muted"}`}
              ></div>
            )}
          </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-foreground hover:text-foreground hover:bg-foreground/20"
                      >
                        <Trash2 size={16} />
                      </Button>
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
                            onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
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
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-200 mb-2">
                Category Name
              </label>
              <input
                id="categoryName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                placeholder="Enter category name"
              />
            </div>
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
            <div>
              <label htmlFor="subcategoryName" className="block text-sm font-medium text-gray-200 mb-2">
                Subcategory Name
              </label>
              <input
                id="subcategoryName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                placeholder="Enter subcategory name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSubcategory} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SetupPage;
