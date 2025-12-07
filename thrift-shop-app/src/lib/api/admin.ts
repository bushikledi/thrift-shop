/**
 * Admin API Service
 */
import { get, put, post, del } from "../apiClient";
import type {
  AdminStatsResponseDto,
  UserProfileResponseDto,
  AdminUpdateUserDto,
  VendorDetailDto,
  AdminUpdateVendorDto,
  OrderResponseDto,
  ProductListItemDto,
  AdminReviewResponseDto,
  AuditLogResponseDto,
  AdminUsersParams,
  AdminVendorsParams,
  AdminOrdersParams,
  PaginationParams,
} from "@/types";

export const adminApi = {
  // === Stats ===
  /**
   * Get admin dashboard stats
   */
  getStats: (): Promise<AdminStatsResponseDto> =>
    get<AdminStatsResponseDto>("/admin/stats"),

  // === Users ===
  /**
   * Get all users
   */
  getUsers: (params?: AdminUsersParams): Promise<UserProfileResponseDto[]> =>
    get<UserProfileResponseDto[]>("/admin/users", { params }),

  /**
   * Get user by ID
   */
  getUserById: (id: string): Promise<UserProfileResponseDto> =>
    get<UserProfileResponseDto>(`/admin/users/${id}`),

  /**
   * Update user
   */
  updateUser: (
    id: string,
    data: AdminUpdateUserDto
  ): Promise<UserProfileResponseDto> =>
    put<UserProfileResponseDto, AdminUpdateUserDto>(`/admin/users/${id}`, data),

  /**
   * Delete user
   */
  deleteUser: (id: string): Promise<UserProfileResponseDto> =>
    del<UserProfileResponseDto>(`/admin/users/${id}`),

  // === Vendors ===
  /**
   * Get all vendors
   */
  getVendors: (params?: AdminVendorsParams): Promise<VendorDetailDto[]> =>
    get<VendorDetailDto[]>("/admin/vendors", { params }),

  /**
   * Get vendor by ID
   */
  getVendorById: (id: string): Promise<VendorDetailDto> =>
    get<VendorDetailDto>(`/admin/vendors/${id}`),

  /**
   * Update vendor
   */
  updateVendor: (
    id: string,
    data: AdminUpdateVendorDto
  ): Promise<VendorDetailDto> =>
    put<VendorDetailDto, AdminUpdateVendorDto>(`/admin/vendors/${id}`, data),

  /**
   * Verify a vendor
   */
  verifyVendor: (id: string): Promise<VendorDetailDto> =>
    post<VendorDetailDto>(`/admin/vendors/${id}/verify`),

  // === Orders ===
  /**
   * Get all orders
   */
  getOrders: (params?: AdminOrdersParams): Promise<OrderResponseDto[]> =>
    get<OrderResponseDto[]>("/admin/orders", { params }),

  /**
   * Get order by ID
   */
  getOrderById: (id: string): Promise<OrderResponseDto> =>
    get<OrderResponseDto>(`/admin/orders/${id}`),

  // === Products ===
  /**
   * Get all products
   */
  getProducts: (
    params: PaginationParams & { includeInactive: boolean }
  ): Promise<ProductListItemDto[]> =>
    get<ProductListItemDto[]>("/admin/products", { params }),

  /**
   * Toggle product featured status
   */
  toggleProductFeatured: (id: string): Promise<ProductListItemDto> =>
    post<ProductListItemDto>(`/admin/products/${id}/toggle-featured`),

  /**
   * Toggle product active status
   */
  toggleProductActive: (id: string): Promise<ProductListItemDto> =>
    post<ProductListItemDto>(`/admin/products/${id}/toggle-active`),

  // === Reviews ===
  /**
   * Get all reviews
   */
  getReviews: (params: PaginationParams): Promise<AdminReviewResponseDto[]> =>
    get<AdminReviewResponseDto[]>("/admin/reviews", { params }),

  /**
   * Delete a review
   */
  deleteReview: (id: string): Promise<void> =>
    del<void>(`/admin/reviews/${id}`),

  // === Audit Logs ===
  /**
   * Get audit logs
   */
  getAuditLogs: (params: PaginationParams): Promise<AuditLogResponseDto[]> =>
    get<AuditLogResponseDto[]>("/admin/audit-logs", { params }),
};

export default adminApi;
