/**
 * Vendors Hooks
 * React Query hooks for vendors operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vendorsApi } from "@/lib/api/vendors";
import { queryKeys } from "./queryKeys";
import type {
  UpdateVendorDto,
  VendorDetailDto,
  PaginationParams,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

// ============================================
// Public Vendor Hooks
// ============================================

/**
 * Get all vendors
 */
export function useVendors(params: PaginationParams & { verified?: boolean }) {
  return useQuery({
    queryKey: queryKeys.vendors.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.list(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get vendor by name (slug)
 */
export function useVendor(name: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(name),
    queryFn: () => vendorsApi.getByName(name),
    enabled: !!name && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get vendor products
 */
export function useVendorProducts(name: string, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.vendors.products(
      name,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.getProducts(name, params),
    enabled: !!name,
    staleTime: 60 * 1000,
  });
}

/**
 * Get vendor reviews
 */
export function useVendorReviews(name: string, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.vendors.reviews(
      name,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.getReviews(name, params),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Vendor Dashboard Hooks (Authenticated)
// ============================================

/**
 * Get current vendor profile
 */
export function useMyVendorProfile() {
  return useQuery({
    queryKey: queryKeys.vendors.me.profile(),
    queryFn: () => vendorsApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update current vendor profile
 */
export function useUpdateMyVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVendorDto) => vendorsApi.updateMyProfile(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.vendors.me.profile(),
      });

      const previousProfile = queryClient.getQueryData<VendorDetailDto>(
        queryKeys.vendors.me.profile()
      );

      if (previousProfile) {
        queryClient.setQueryData(queryKeys.vendors.me.profile(), {
          ...previousProfile,
          ...data,
        });
      }

      return { previousProfile };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.vendors.me.profile(),
          context.previousProfile
        );
      }
      toast.error(error.message || "Failed to update profile");
    },
    onSuccess: (profile: VendorDetailDto) => {
      queryClient.setQueryData(queryKeys.vendors.me.profile(), profile);
      // Also update public vendor cache if exists
      queryClient.setQueryData(queryKeys.vendors.detail(profile.name), profile);
      toast.success("Profile updated successfully");
    },
  });
}

/**
 * Get vendor dashboard stats
 */
export function useMyVendorStats() {
  return useQuery({
    queryKey: queryKeys.vendors.me.stats(),
    queryFn: () => vendorsApi.getMyStats(),
    staleTime: 60 * 1000, // 1 minute - stats should be fresh
  });
}

/**
 * Get current vendor products
 */
export function useMyVendorProducts(
  params: PaginationParams & { includeInactive?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.vendors.me.products(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.getMyProducts(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Get current vendor orders
 */
export function useMyVendorOrders(
  params: PaginationParams & { status?: string }
) {
  return useQuery({
    queryKey: queryKeys.vendors.me.orders(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.getMyOrders(params),
    staleTime: 30 * 1000, // 30 seconds - orders need to be fresh
  });
}

/**
 * Get specific vendor order
 */
export function useMyVendorOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendors.me.order(id),
    queryFn: () => vendorsApi.getMyOrder(id),
    enabled: !!id && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Get current vendor reviews
 */
export function useMyVendorReviews(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.vendors.me.reviews(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => vendorsApi.getMyReviews(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch vendor for navigation
 */
export function usePrefetchVendor() {
  const queryClient = useQueryClient();

  return (name: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendors.detail(name),
      queryFn: () => vendorsApi.getByName(name),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Store analytics for a rolling window (vendor only).
 */
export function useMyVendorAnalytics(days = 30) {
  return useQuery({
    queryKey: queryKeys.vendors.me.analytics(days),
    queryFn: () => vendorsApi.getMyAnalytics(days),
    staleTime: 5 * 60 * 1000,
  });
}
