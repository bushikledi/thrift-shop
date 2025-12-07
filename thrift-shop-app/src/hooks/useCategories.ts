/**
 * Categories Hooks
 * React Query hooks for categories operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi } from "@/lib/api/categories";
import { queryKeys } from "./queryKeys";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Get all categories (tree structure)
 */
export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.categories.list(includeInactive),
    queryFn: () => categoriesApi.list(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
}

/**
 * Get category by slug
 */
export function useCategory(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Create category mutation (admin only)
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category created successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to create category");
    },
  });
}

/**
 * Update category mutation (admin only)
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      // Optimistic update in the list
      const previousCategories = queryClient.getQueryData<
        CategoryResponseDto[]
      >(queryKeys.categories.list(true));

      if (previousCategories) {
        const updateCategory = (
          categories: CategoryResponseDto[]
        ): CategoryResponseDto[] => {
          return categories.map((cat) => {
            if (cat.id === id) {
              return { ...cat, ...data };
            }
            if (cat.children) {
              return { ...cat, children: updateCategory(cat.children) };
            }
            return cat;
          });
        };

        queryClient.setQueryData(
          queryKeys.categories.list(true),
          updateCategory(previousCategories)
        );
      }

      return { previousCategories };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(true),
          context.previousCategories
        );
      }
      toast.error(error.message || "Failed to update category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category updated successfully");
    },
  });
}

/**
 * Delete category mutation (admin only)
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
}

/**
 * Helper hook to get flat list of categories
 */
export function useFlatCategories(includeInactive = false) {
  const { data: categories, ...rest } = useCategories(includeInactive);

  const flattenCategories = (
    cats: CategoryResponseDto[],
    level = 0
  ): (CategoryResponseDto & { level: number })[] => {
    return cats.flatMap((cat) => [
      { ...cat, level },
      ...(cat.children ? flattenCategories(cat.children, level + 1) : []),
    ]);
  };

  return {
    data: categories ? flattenCategories(categories) : undefined,
    ...rest,
  };
}

/**
 * Helper hook to get category options for select inputs
 */
export function useCategoryOptions(includeInactive = false) {
  const { data: categories, ...rest } = useFlatCategories(includeInactive);

  const options =
    categories?.map((cat) => ({
      value: cat.id,
      label: `${"—".repeat(cat.level)} ${cat.name}`.trim(),
      slug: cat.slug,
    })) ?? [];

  return { data: options, ...rest };
}
