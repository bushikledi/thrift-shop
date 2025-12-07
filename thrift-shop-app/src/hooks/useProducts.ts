/**
 * Products Hooks
 * React Query hooks for products operations
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { productsApi } from "@/lib/api/products";
import { queryKeys } from "./queryKeys";
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductsListParams,
  ProductDetailDto,
  PaginatedProductsResponseDto,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Get products list with filters
 */
export function useProducts(params?: ProductsListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: () => productsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get products with infinite scroll
 */
export function useInfiniteProducts(params?: Omit<ProductsListParams, "page">) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list({ ...params, infinite: true } as Record<
      string,
      unknown
    >),
    queryFn: ({ pageParam = 1 }) =>
      productsApi.list({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage.meta.totalPages;
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });
}

/**
 * Get product by slug
 */
export function useProduct(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get featured products
 */
export function useFeaturedProducts(limit: number = 8) {
  return useQuery({
    queryKey: queryKeys.products.featured(limit),
    queryFn: () => productsApi.getFeatured(limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get related products
 */
export function useRelatedProducts(id: string, limit: number = 4) {
  return useQuery({
    queryKey: queryKeys.products.related(id, limit),
    queryFn: () => productsApi.getRelated(id, limit),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create product mutation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),
    onSuccess: () => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      // Invalidate vendor products
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.me.products(),
      });
      toast.success("Product created successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

/**
 * Update product mutation with optimistic updates
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.all,
      });

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData<ProductDetailDto>(
        queryKeys.products.detail(id)
      );

      // Optimistically update
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), {
          ...previousProduct,
          ...data,
        });
      }

      return { previousProduct };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(id),
          context.previousProduct
        );
      }
      toast.error(error.message || "Failed to update product");
    },
    onSuccess: (product: ProductDetailDto) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.products.detail(product.slug),
        product
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.me.products(),
      });
      toast.success("Product updated successfully");
    },
  });
}

/**
 * Delete product mutation with optimistic updates
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.lists(),
      });

      // Snapshot for rollback
      const previousProducts =
        queryClient.getQueriesData<PaginatedProductsResponseDto>({
          queryKey: queryKeys.products.lists(),
        });

      // Optimistically remove from all lists
      queryClient.setQueriesData<PaginatedProductsResponseDto>(
        { queryKey: queryKeys.products.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      return { previousProducts };
    },
    onError: (error: ApiError, id, context) => {
      // Rollback on error
      context?.previousProducts.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data);
        }
      });
      toast.error(error.message || "Failed to delete product");
    },
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.me.products(),
      });
      toast.success("Product deleted successfully");
    },
  });
}

/**
 * Prefetch product for navigation
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(slug),
      queryFn: () => productsApi.getBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Get vendor's own products
 * Alias for useProducts with vendorId filter
 */
export function useVendorProducts(params?: ProductsListParams) {
  return useProducts(params);
}
