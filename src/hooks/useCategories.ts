// useCategories hook - Fetch and manage categories and subcategories
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
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
import { queryKeys } from "../lib/queryKeys";
import type { Category, Subcategory, CategoryType } from "../types";

interface UseCategoriesReturn {
  categories: Category[];
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCategory: (
    name: string,
    type: CategoryType
  ) => Promise<{ success: boolean; error?: string; data?: Category }>;
  editCategory: (
    id: string,
    updates: { name?: string }
  ) => Promise<{ success: boolean; error?: string; data?: Category }>;
  removeCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  addSubcategory: (
    name: string,
    categoryId: string
  ) => Promise<{ success: boolean; error?: string; data?: Subcategory }>;
  editSubcategory: (
    id: string,
    updates: { name?: string; category_id?: string }
  ) => Promise<{ success: boolean; error?: string; data?: Subcategory }>;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Categories query
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const response = await getCategories();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch categories");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // Subcategories query
  const {
    data: subcategories = [],
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
    refetch: refetchSubcategories,
  } = useQuery({
    queryKey: queryKeys.categories.subcategories.list(),
    queryFn: async () => {
      const response = await getSubcategories();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch subcategories");
      }
      return response.data || [];
    },
    enabled: !!user,
  });

  // Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; type: CategoryType }) => {
      return await createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string } }) => {
      return await updateCategory(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Subcategory mutations
  const addSubcategoryMutation = useMutation({
    mutationFn: async (data: { name: string; category_id: string }) => {
      return await createSubcategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subcategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; category_id?: string };
    }) => {
      return await updateSubcategory(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subcategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSubcategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subcategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Wrapper functions to maintain interface
  const addCategory = async (name: string, type: CategoryType) => {
    const result = await addCategoryMutation.mutateAsync({ name, type });
    return result;
  };

  const editCategory = async (id: string, updates: { name?: string }) => {
    const result = await updateCategoryMutation.mutateAsync({ id, updates });
    return result;
  };

  const removeCategory = async (id: string) => {
    const result = await deleteCategoryMutation.mutateAsync(id);
    return result;
  };

  const addSubcategory = async (name: string, categoryId: string) => {
    const result = await addSubcategoryMutation.mutateAsync({
      name,
      category_id: categoryId,
    });
    return result;
  };

  const editSubcategory = async (id: string, updates: { name?: string; category_id?: string }) => {
    const result = await updateSubcategoryMutation.mutateAsync({ id, updates });
    return result;
  };

  const removeSubcategory = async (id: string) => {
    const result = await deleteSubcategoryMutation.mutateAsync(id);
    return result;
  };

  const refresh = async () => {
    await Promise.all([refetchCategories(), refetchSubcategories()]);
  };

  // Helper function to get subcategories for a specific category
  const getSubcategoriesByCategory = useCallback(
    (categoryId: string) => {
      return subcategories.filter((sub) => sub.category_id === categoryId);
    },
    [subcategories]
  );

  const loading = categoriesLoading || subcategoriesLoading;
  const error = categoriesError?.message || subcategoriesError?.message || null;

  return {
    categories,
    subcategories,
    loading,
    error,
    refresh,
    addCategory,
    editCategory,
    removeCategory,
    addSubcategory,
    editSubcategory,
    removeSubcategory,
    getSubcategoriesByCategory,
  };
}
