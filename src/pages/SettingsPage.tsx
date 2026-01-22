import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { AccountForm } from "@/components/features/AccountForm";
import { CategoryForm } from "@/components/features/CategoryForm";
import { SubcategoryForm } from "@/components/features/SubcategoryForm";
import {
  User,
  Lock,
  LogOut,
  AlertTriangle,
  Trash2,
  Info,
  Pencil,
  Bot,
  Briefcase,
  Smile,
  Shield,
} from "lucide-react";
import type { Account, Category, Subcategory, AIPersonality } from "@/types";
import * as chatService from "@/services/chat";

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, updatePassword, error, clearError } = useAuth();
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

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);

  // State for editing items
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  // AI Personality state
  const [aiPersonality, setAIPersonality] = useState<AIPersonality>("friendly");
  const [aiPersonalityLoading, setAIPersonalityLoading] = useState(true);
  const [aiPersonalitySaving, setAIPersonalitySaving] = useState(false);
  const [aiPersonalitySaved, setAIPersonalitySaved] = useState(false);

  // Load AI personality on mount
  useEffect(() => {
    async function loadPersonality() {
      const response = await chatService.getAIPersonality();
      if (response.success && response.data) {
        setAIPersonality(response.data.ai_personality);
      }
      setAIPersonalityLoading(false);
    }
    loadPersonality();
  }, []);

  // Handle AI personality change
  const handleAIPersonalityChange = async (personality: AIPersonality) => {
    setAIPersonality(personality);
    setAIPersonalitySaving(true);
    setAIPersonalitySaved(false);

    const response = await chatService.updateAIPersonality(personality);
    if (response.success) {
      setAIPersonalitySaved(true);
      setTimeout(() => setAIPersonalitySaved(false), 2000);
    }
    setAIPersonalitySaving(false);
  };

  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordUpdated(false);
    clearError();

    try {
      await updatePassword(newPassword);
      setPasswordUpdated(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleDeleteAccount = () => {
    alert("Account deletion will be available in a future update.");
    setShowDeleteConfirm(false);
  };

  const handleDeleteAccountItem = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the account "${name}"? This action cannot be undone.`
      )
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

  // Edit handlers
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAddAccount(false); // Close add form if open
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddCategory(false); // Close add form if open
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setShowAddSubcategory(false); // Close add form if open
  };

  const userCategories = categories.filter((cat) => !cat.is_system);
  const userSubcategories = subcategories.filter((sub) => !sub.is_system);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences</p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-foreground/20 border-2 border-foreground flex items-center justify-center">
              <User className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-foreground mt-1">{user?.email || "Not available"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">User ID</label>
            <p className="text-muted-foreground text-sm mt-1 font-mono">{user?.id || "Not available"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Account Created</label>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not available"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-foreground/20 border-2 border-foreground flex items-center justify-center">
              <Lock className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Input
              type="password"
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors({});
                setPasswordUpdated(false);
              }}
              error={passwordErrors.newPassword}
              helperText="Minimum 6 characters"
              fullWidth
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />

            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordErrors({});
                setPasswordUpdated(false);
              }}
              error={passwordErrors.confirmPassword}
              fullWidth
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />

            {error && (
              <div className="p-3 rounded-lg bg-foreground/10 border border-border text-foreground text-sm">
                {error}
              </div>
            )}

            {passwordUpdated && (
              <div className="p-3 rounded-lg bg-foreground/10 border border-border text-foreground text-sm">
                Password updated successfully!
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingPassword}
              disabled={isUpdatingPassword}
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Accounts Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Manage your financial accounts</CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddAccount(!showAddAccount);
                setEditingAccount(null); // Close edit form if open
              }}
            >
              {showAddAccount ? "Cancel" : "Add Account"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddAccount && (
            <div className="p-4 bg-muted rounded-lg border border-border">
              <AccountForm
                onSubmit={async (data) => {
                  const result = await addAccount(data.name, data.type, data.initialBalance);
                  if (result.success) {
                    setShowAddAccount(false);
                  }
                  return result;
                }}
                submitLabel="Add Account"
                showCancel
                onCancel={() => setShowAddAccount(false)}
              />
            </div>
          )}

          {editingAccount && (
            <div className="p-4 bg-muted rounded-lg border border-foreground">
              <h4 className="text-sm font-medium text-foreground mb-3">Edit Account</h4>
              <AccountForm
                initialData={editingAccount}
                onSubmit={async (data) => {
                  const result = await editAccount(editingAccount.id, {
                    name: data.name,
                    type: data.type,
                    initial_balance: data.initialBalance,
                  });
                  if (result.success) {
                    setEditingAccount(null);
                  }
                  return result;
                }}
                submitLabel="Save Changes"
                showCancel
                onCancel={() => setEditingAccount(null)}
              />
            </div>
          )}

          {accountsLoading ? (
            <p className="text-muted-foreground">Loading accounts...</p>
          ) : accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
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
                      className="text-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccountItem(account.id, account.name)}
                      className="text-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No accounts yet.</p>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg">
            <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Renaming accounts will automatically update all related transactions via foreign key
              relationships.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize your income and expenses</CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddCategory(!showAddCategory);
                setEditingCategory(null); // Close edit form if open
              }}
            >
              {showAddCategory ? "Cancel" : "Add Category"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddCategory && (
            <div className="p-4 bg-muted rounded-lg border border-border">
              <CategoryForm
                onSubmit={async (data) => {
                  const result = await addCategory(data.name, data.type);
                  if (result.success) {
                    setShowAddCategory(false);
                  }
                  return result;
                }}
                submitLabel="Add Category"
                showCancel
                onCancel={() => setShowAddCategory(false)}
              />
            </div>
          )}

          {editingCategory && (
            <div className="p-4 bg-card rounded-lg border border-foreground">
              <h4 className="text-sm font-medium text-foreground mb-3">Edit Category</h4>
              <CategoryForm
                initialData={editingCategory}
                onSubmit={async (data) => {
                  const result = await editCategory(editingCategory.id, {
                    name: data.name,
                  });
                  if (result.success) {
                    setEditingCategory(null);
                  }
                  return result;
                }}
                submitLabel="Save Changes"
                showCancel
                onCancel={() => setEditingCategory(null)}
                disableTypeChange
              />
            </div>
          )}

          {categoriesLoading ? (
            <p className="text-muted-foreground">Loading categories...</p>
          ) : userCategories.length > 0 ? (
            <div className="space-y-2">
              {userCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.type === "income" ? "Income" : "Expense"}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No categories yet.</p>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg">
            <Info size={16} className="text-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              Cannot delete categories with subcategories. Delete subcategories first.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subcategories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subcategories</CardTitle>
              <CardDescription>Further organize your transactions</CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddSubcategory(!showAddSubcategory);
                setEditingSubcategory(null); // Close edit form if open
              }}
              disabled={categories.length === 0}
            >
              {showAddSubcategory ? "Cancel" : "Add Subcategory"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddSubcategory && (
            <div className="p-4 bg-muted rounded-lg border border-border">
              <SubcategoryForm
                categories={categories}
                onSubmit={async (data) => {
                  const result = await addSubcategory(data.name, data.categoryId);
                  if (result.success) {
                    setShowAddSubcategory(false);
                  }
                  return result;
                }}
                submitLabel="Add Subcategory"
                showCancel
                onCancel={() => setShowAddSubcategory(false)}
              />
            </div>
          )}

          {editingSubcategory && (
            <div className="p-4 bg-card rounded-lg border border-foreground">
              <h4 className="text-sm font-medium text-foreground mb-3">Edit Subcategory</h4>
              <SubcategoryForm
                categories={categories}
                initialData={editingSubcategory}
                onSubmit={async (data) => {
                  const result = await editSubcategory(editingSubcategory.id, {
                    name: data.name,
                    category_id: data.categoryId,
                  });
                  if (result.success) {
                    setEditingSubcategory(null);
                  }
                  return result;
                }}
                submitLabel="Save Changes"
                showCancel
                onCancel={() => setEditingSubcategory(null)}
              />
            </div>
          )}

          {categoriesLoading ? (
            <p className="text-muted-foreground">Loading subcategories...</p>
          ) : userSubcategories.length > 0 ? (
            <div className="space-y-2">
              {userSubcategories.map((subcategory) => {
                const category = categories.find((cat) => cat.id === subcategory.category_id);
                return (
                  <div
                    key={subcategory.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{subcategory.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Category: {category?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                        onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                        className="text-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No subcategories yet.</p>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg">
            <Info size={16} className="text-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              Names must be unique across all accounts, categories, and subcategories.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Personality */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-foreground/20 border-2 border-foreground flex items-center justify-center">
              <Bot className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Customize your AI assistant's personality</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiPersonalityLoading ? (
            <p className="text-muted-foreground">Loading preferences...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how your AI assistant communicates with you. This affects the tone and style
                of responses.
              </p>
              <div className="space-y-3">
                {/* Professional */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                    aiPersonality === "professional"
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-border bg-card"
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    value="professional"
                    checked={aiPersonality === "professional"}
                    onChange={() => handleAIPersonalityChange("professional")}
                    className="sr-only"
                    disabled={aiPersonalitySaving}
                  />
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Professional</span>
                      {aiPersonality === "professional" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clear, concise, and formal. Focused on accuracy and actionable
                      recommendations.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Example: "Your grocery spending increased by 15% this month. Consider
                      reviewing recurring subscriptions."
                    </p>
                  </div>
                </label>

                {/* Friendly */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                    aiPersonality === "friendly"
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-border bg-card"
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    value="friendly"
                    checked={aiPersonality === "friendly"}
                    onChange={() => handleAIPersonalityChange("friendly")}
                    className="sr-only"
                    disabled={aiPersonalitySaving}
                  />
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Smile className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Friendly</span>
                      {aiPersonality === "friendly" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Warm, encouraging, and supportive. Makes financial management feel less
                      intimidating.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Example: "Great job staying under budget! You saved $50 on dining out - that's
                      awesome!"
                    </p>
                  </div>
                </label>

                {/* Stern */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                    aiPersonality === "stern"
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-border bg-card"
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    value="stern"
                    checked={aiPersonality === "stern"}
                    onChange={() => handleAIPersonalityChange("stern")}
                    className="sr-only"
                    disabled={aiPersonalitySaving}
                  />
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Stern</span>
                      {aiPersonality === "stern" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Direct and no-nonsense. Holds you accountable and doesn't sugarcoat reality.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Example: "You overspent by $200 this month. Cut the unnecessary subscriptions
                      immediately."
                    </p>
                  </div>
                </label>
              </div>

              {/* Saving indicator */}
              {aiPersonalitySaving && <p className="text-sm text-foreground mt-2">Saving...</p>}
              {aiPersonalitySaved && (
                <p className="text-sm text-foreground mt-2">Personality updated!</p>
              )}

              <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg mt-4">
                <Info size={16} className="text-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono">
                    Ctrl+K
                  </kbd>{" "}
                  to open the AI Assistant from anywhere in the app.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sign Out & Delete Account */}
      <Card className="border-2 border-foreground/50">
        <CardHeader>
          <CardTitle className="text-foreground">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
            <div>
              <h3 className="font-medium text-foreground">Sign Out</h3>
              <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-foreground/10 border border-foreground/50">
            <div>
              <h3 className="font-medium text-foreground">Delete Account</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            {!showDeleteConfirm ? (
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} size="sm">
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount} size="sm">
                  Confirm Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
