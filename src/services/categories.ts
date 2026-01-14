// Categories and subcategories service - CRUD operations
import { supabase } from "../lib/supabaseClient";
import type { Category, Subcategory, CategoryType } from "../types";

// ============== CATEGORIES ==============

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryData {
  name?: string;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category;
  error?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data?: Category[];
  error?: string;
}

/**
 * Create a new category
 */
export async function createCategory(categoryData: CreateCategoryData): Promise<CategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check for name uniqueness (across accounts, categories, and subcategories)
    const { data: existingAccounts } = await supabase
      .from("accounts")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", categoryData.name)
      .is("deleted_at", null);

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", categoryData.name)
      .is("deleted_at", null);

    const { data: existingSubcategories } = await supabase
      .from("subcategories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", categoryData.name)
      .is("deleted_at", null);

    if (
      (existingAccounts && existingAccounts.length > 0) ||
      (existingCategories && existingCategories.length > 0) ||
      (existingSubcategories && existingSubcategories.length > 0)
    ) {
      return {
        success: false,
        error: "An account, category, or subcategory with this name already exists",
      };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: categoryData.name,
        type: categoryData.type,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all categories for the current user (non-deleted)
 */
export async function getCategories(): Promise<CategoriesResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("is_system", { ascending: false }) // System categories first
      .order("type", { ascending: true }) // Then by type
      .order("created_at", { ascending: true }); // Then by creation date

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<CategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update a category
 * Note: Cannot update system categories
 */
export async function updateCategory(
  id: string,
  updates: UpdateCategoryData
): Promise<CategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if this is a system category
    const { data: category } = await supabase
      .from("categories")
      .select("is_system")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (category?.is_system) {
      return {
        success: false,
        error: "Cannot update system categories",
      };
    }

    // If updating name, check for uniqueness
    if (updates.name) {
      const { data: existingAccounts } = await supabase
        .from("accounts")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      const { data: existingCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null)
        .neq("id", id);

      const { data: existingSubcategories } = await supabase
        .from("subcategories")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      if (
        (existingAccounts && existingAccounts.length > 0) ||
        (existingCategories && existingCategories.length > 0) ||
        (existingSubcategories && existingSubcategories.length > 0)
      ) {
        return {
          success: false,
          error: "An account, category, or subcategory with this name already exists",
        };
      }
    }

    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Soft delete a category (only if no subcategories exist)
 */
export async function deleteCategory(id: string): Promise<CategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if this is a system category
    const { data: category } = await supabase
      .from("categories")
      .select("is_system")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (category?.is_system) {
      return {
        success: false,
        error: "Cannot delete system categories",
      };
    }

    // Check for subcategories
    const { count } = await supabase
      .from("subcategories")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (count && count > 0) {
      return {
        success: false,
        error: "Cannot delete category with subcategories. Delete subcategories first.",
      };
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============== SUBCATEGORIES ==============

export interface CreateSubcategoryData {
  name: string;
  category_id: string;
}

export interface UpdateSubcategoryData {
  name?: string;
  category_id?: string;
}

export interface SubcategoryResponse {
  success: boolean;
  data?: Subcategory;
  error?: string;
}

export interface SubcategoriesResponse {
  success: boolean;
  data?: Subcategory[];
  error?: string;
}

/**
 * Create a new subcategory
 */
export async function createSubcategory(
  subcategoryData: CreateSubcategoryData
): Promise<SubcategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check for name uniqueness (across accounts, categories, and subcategories)
    const { data: existingAccounts } = await supabase
      .from("accounts")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", subcategoryData.name)
      .is("deleted_at", null);

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", subcategoryData.name)
      .is("deleted_at", null);

    const { data: existingSubcategories } = await supabase
      .from("subcategories")
      .select("name")
      .eq("user_id", user.id)
      .eq("name", subcategoryData.name)
      .is("deleted_at", null);

    if (
      (existingAccounts && existingAccounts.length > 0) ||
      (existingCategories && existingCategories.length > 0) ||
      (existingSubcategories && existingSubcategories.length > 0)
    ) {
      return {
        success: false,
        error: "An account, category, or subcategory with this name already exists",
      };
    }

    const { data, error } = await supabase
      .from("subcategories")
      .insert({
        user_id: user.id,
        name: subcategoryData.name,
        category_id: subcategoryData.category_id,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all subcategories for the current user (non-deleted)
 */
export async function getSubcategories(): Promise<SubcategoriesResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("is_system", { ascending: false }) // System subcategories first
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get subcategories for a specific category
 */
export async function getSubcategoriesByCategory(
  categoryId: string
): Promise<SubcategoriesResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .order("is_system", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a single subcategory by ID
 */
export async function getSubcategoryById(id: string): Promise<SubcategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update a subcategory
 * Note: Cannot update system subcategories
 */
export async function updateSubcategory(
  id: string,
  updates: UpdateSubcategoryData
): Promise<SubcategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if this is a system subcategory
    const { data: subcategory } = await supabase
      .from("subcategories")
      .select("is_system")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (subcategory?.is_system) {
      return {
        success: false,
        error: "Cannot update system subcategories",
      };
    }

    // If updating name, check for uniqueness
    if (updates.name) {
      const { data: existingAccounts } = await supabase
        .from("accounts")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      const { data: existingCategories } = await supabase
        .from("categories")
        .select("name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null);

      const { data: existingSubcategories } = await supabase
        .from("subcategories")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .is("deleted_at", null)
        .neq("id", id);

      if (
        (existingAccounts && existingAccounts.length > 0) ||
        (existingCategories && existingCategories.length > 0) ||
        (existingSubcategories && existingSubcategories.length > 0)
      ) {
        return {
          success: false,
          error: "An account, category, or subcategory with this name already exists",
        };
      }
    }

    const { data, error } = await supabase
      .from("subcategories")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Soft delete a subcategory
 */
export async function deleteSubcategory(id: string): Promise<SubcategoryResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if this is a system subcategory
    const { data: subcategory } = await supabase
      .from("subcategories")
      .select("is_system")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (subcategory?.is_system) {
      return {
        success: false,
        error: "Cannot delete system subcategories",
      };
    }

    const { data, error } = await supabase
      .from("subcategories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete all transactions associated with a subcategory (soft delete)
 */
export async function deleteSubcategoryTransactions(
  subcategoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("subcategory_id", subcategoryId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get count of transactions for a subcategory
 */
export async function getSubcategoryTransactionCount(
  subcategoryId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { count, error } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("subcategory_id", subcategoryId)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Set subcategory to "Unassigned" for all transactions with given subcategory
 */
export async function unassignSubcategoryTransactions(
  subcategoryId: string,
  unassignedSubcategoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("transactions")
      .update({ subcategory_id: unassignedSubcategoryId })
      .eq("subcategory_id", subcategoryId)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
