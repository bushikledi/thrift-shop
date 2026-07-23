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

export interface PlatformSettings {
  siteName: string;
  siteDescription: string | null;
  supportEmail: string | null;
  maintenanceMode: boolean;
  updatedAt: string;
}

export type UpdatePlatformSettings = Partial<
  Omit<PlatformSettings, "updatedAt">
>;

export interface AnalyticsSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsNamedTotal {
  name: string;
  revenue: number;
  orders: number;
}

export interface AdminAnalytics {
  days: number;
  series: AnalyticsSeriesPoint[];
  topCategories: AnalyticsNamedTotal[];
  topVendors: AnalyticsNamedTotal[];
}

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

  /**
   * Platform settings
   */
  getSettings: (): Promise<PlatformSettings> =>
    get<PlatformSettings>("/admin/settings"),

  updateSettings: (
    data: UpdatePlatformSettings
  ): Promise<PlatformSettings> =>
    put<PlatformSettings, UpdatePlatformSettings>("/admin/settings", data),

  /**
   * Product moderation
   */
  flagProduct: (id: string, reason: string): Promise<unknown> =>
    post<unknown, { reason: string }>(`/admin/products/${id}/flag`, { reason }),

  unflagProduct: (id: string): Promise<unknown> =>
    post<unknown, undefined>(`/admin/products/${id}/unflag`, undefined),

  deleteProduct: (id: string): Promise<{ message: string }> =>
    del<{ message: string }>(`/admin/products/${id}`),

  /**
   * Platform analytics for a rolling window
   */
  getAnalytics: (days = 30): Promise<AdminAnalytics> =>
    get<AdminAnalytics>("/admin/analytics", { params: { days } }),
};

export default adminApi;