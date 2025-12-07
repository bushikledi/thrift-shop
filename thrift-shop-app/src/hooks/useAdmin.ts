/**
 * Admin Hooks
 * React Query hooks for admin operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "./queryKeys";
import type {
  AdminUpdateUserDto,
  AdminUpdateVendorDto,
  AdminUsersParams,
  AdminVendorsParams,
  AdminOrdersParams,
  PaginationParams,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

// ============================================
// Stats
// ============================================

/**
 * Get admin dashboard stats
 */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => adminApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================
// Users
// ============================================

/**
 * Get all users (admin)
 */
export function useAdminUsers(params?: AdminUsersParams) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(params as Record<string, unknown>),
    queryFn: () => adminApi.getUsers(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Get user by ID (admin)
 */
export function useAdminUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    queryFn: () => adminApi.getUserById(id),
    enabled: !!id && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Update user (admin)
 */
export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserDto }) =>
      adminApi.updateUser(id, data),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.admin.users.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      toast.success("User updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update user");
    },
  });
}

/**
 * Delete user (admin)
 */
export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      toast.success("User deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
}

// ============================================
// Vendors
// ============================================

/**
 * Get all vendors (admin)
 */
export function useAdminVendors(params?: AdminVendorsParams) {
  return useQuery({
    queryKey: queryKeys.admin.vendors.list(params as Record<string, unknown>),
    queryFn: () => adminApi.getVendors(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Get vendor by ID (admin)
 */
export function useAdminVendor(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.vendors.detail(id),
    queryFn: () => adminApi.getVendorById(id),
    enabled: !!id && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Update vendor (admin)
 */
export function useAdminUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateVendorDto }) =>
      adminApi.updateVendor(id, data),
    onSuccess: (vendor) => {
      queryClient.setQueryData(
        queryKeys.admin.vendors.detail(vendor.id),
        vendor
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.vendors.all });
      toast.success("Vendor updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update vendor");
    },
  });
}

/**
 * Verify vendor (admin)
 */
export function useAdminVerifyVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.verifyVendor(id),
    onSuccess: (vendor) => {
      queryClient.setQueryData(
        queryKeys.admin.vendors.detail(vendor.id),
        vendor
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.vendors.all });
      toast.success("Vendor verified successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to verify vendor");
    },
  });
}

// ============================================
// Orders
// ============================================

/**
 * Get all orders (admin)
 */
export function useAdminOrders(params?: AdminOrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders.list(params as Record<string, unknown>),
    queryFn: () => adminApi.getOrders(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Get order by ID (admin)
 */
export function useAdminOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.orders.detail(id),
    queryFn: () => adminApi.getOrderById(id),
    enabled: !!id && enabled,
    staleTime: 30 * 1000,
  });
}

// ============================================
// Products
// ============================================

/**
 * Get all products (admin)
 */
export function useAdminProducts(
  params: PaginationParams & { includeInactive: boolean }
) {
  return useQuery({
    queryKey: queryKeys.admin.products.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => adminApi.getProducts(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Toggle product featured status (admin)
 */
export function useAdminToggleProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.toggleProductFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Product featured status toggled");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to toggle featured status");
    },
  });
}

/**
 * Toggle product active status (admin)
 */
export function useAdminToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.toggleProductActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Product active status toggled");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to toggle active status");
    },
  });
}

// ============================================
// Reviews
// ============================================

/**
 * Get all reviews (admin)
 */
export function useAdminReviews(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.admin.reviews.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => adminApi.getReviews(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Delete review (admin)
 */
export function useAdminDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      toast.success("Review deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
}

// ============================================
// Audit Logs
// ============================================

/**
 * Get audit logs (admin)
 */
export function useAdminAuditLogs(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => adminApi.getAuditLogs(params),
    staleTime: 30 * 1000,
  });
}
