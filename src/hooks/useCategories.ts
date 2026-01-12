// useCategories hook - Fetch and manage categories and subcategories
import { useState, useEffect, useCallback } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../services/categories";
import { useAuth } from "./useAuth";
import type { Category, Subcategory, CategoryType } from "../types";

interface UseCategoriesReturn {
  categories: Category[];
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCategory: (name: string, type: CategoryType) => Promise<{ success: boolean; error?: string; data?: Category }>;
  editCategory: (id: string, updates: { name?: string }) => Promise<{ success: boolean; error?: string; data?: Category }>;
  removeCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  addSubcategory: (name: string, categoryId: string) => Promise<{ success: boolean; error?: string; data?: Subcategory }>;
  editSubcategory: (id: string, updates: { name?: string; category_id?: string }) => Promise<{ success: boolean; error?: string; data?: Subcategory }>;
  removeSubcategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  getSubcategoriesByCategory: (categoryId: string) => Subcategory[];
}

/**
 * Custom hook for managing categories and subcategories
 *
 * Usage:
 * ```tsx
 * const {
 *   categories,
 *   subcategories,
 *   loading,
 *   error,
 *   refresh,
 *   addCategory,
 *   editCategory,
 *   removeCategory,
 *   addSubcategory,
 *   editSubcategory,
 *   removeSubcategory,
 *   getSubcategoriesByCategory
 * } = useCategories();
 * ```
 */
export function useCategories(): UseCategoriesReturn {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories and subcategories
  const fetchData = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [categoriesResponse, subcategoriesResponse] = await Promise.all([
      getCategories(),
      getSubcategories(),
    ]);

    if (categoriesResponse.success && categoriesResponse.data) {
      setCategories(categoriesResponse.data);
    } else {
      setError(categoriesResponse.error || "Failed to fetch categories");
    }

    if (subcategoriesResponse.success && subcategoriesResponse.data) {
      setSubcategories(subcategoriesResponse.data);
    } else {
      setError(
        (prevError) =>
          prevError ||
          subcategoriesResponse.error ||
          "Failed to fetch subcategories"
      );
    }

    setLoading(false);
  }, [user]);

  // Load data when auth is ready and user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
      setCategories([]);
      setSubcategories([]);
    }
  }, [authLoading, user, fetchData]);

  // Category operations

  const addCategory = useCallback(async (name: string, type: CategoryType) => {
    const response = await createCategory({ name, type });

    if (response.success && response.data) {
      setCategories((prev) => [...prev, response.data!]);
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const editCategory = useCallback(
    async (id: string, updates: { name?: string }) => {
      const response = await updateCategory(id, updates);

      if (response.success && response.data) {
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? response.data! : cat))
        );
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  const removeCategory = useCallback(async (id: string) => {
    const response = await deleteCategory(id);

    if (response.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  // Subcategory operations

  const addSubcategory = useCallback(
    async (name: string, categoryId: string) => {
      const response = await createSubcategory({ name, category_id: categoryId });

      if (response.success && response.data) {
        setSubcategories((prev) => [...prev, response.data!]);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  const editSubcategory = useCallback(
    async (id: string, updates: { name?: string; category_id?: string }) => {
      const response = await updateSubcategory(id, updates);

      if (response.success && response.data) {
        setSubcategories((prev) =>
          prev.map((sub) => (sub.id === id ? response.data! : sub))
        );
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    },
    []
  );

  const removeSubcategory = useCallback(async (id: string) => {
    const response = await deleteSubcategory(id);

    if (response.success) {
      setSubcategories((prev) => prev.filter((sub) => sub.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  // Helper function to get subcategories for a specific category
  const getSubcategoriesByCategory = useCallback(
    (categoryId: string) => {
      return subcategories.filter((sub) => sub.category_id === categoryId);
    },
    [subcategories]
  );

  return {
    categories,
    subcategories,
    loading,
    error,
    refresh: fetchData,
    addCategory,
    editCategory,
    removeCategory,
    addSubcategory,
    editSubcategory,
    removeSubcategory,
    getSubcategoriesByCategory,
  };
}
