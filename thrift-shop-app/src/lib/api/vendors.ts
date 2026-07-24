/**
 * Vendors API Service
 */
import { get, put } from "../apiClient";
import type {
  VendorDetailDto,
  VendorDashboardStatsDto,
  UpdateVendorDto,
  ProductListItemDto,
  PaginatedProductsResponseDto,
  ReviewSummaryDto,
  ReviewListResponseDto,
  OrderResponseDto,
  PaginationParams,
} from "@/types";

export interface VendorAnalytics {
  days: number;
  series: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; revenue: number; orders: number }>;
}

export const vendorsApi = {
  /**
   * Get all vendors
   */
  list: (
    params: PaginationParams & { verified?: boolean }
  ): Promise<VendorDetailDto[]> =>
    get<VendorDetailDto[]>("/vendors", { params }),

  /**
   * Get vendor by name (slug)
   */
  getByName: (name: string): Promise<VendorDetailDto> =>
    get<VendorDetailDto>(`/vendors/${name}`),

  /**
   * Get vendor products
   */
  getProducts: (
    name: string,
    params: PaginationParams
  ): Promise<PaginatedProductsResponseDto> =>
    get<PaginatedProductsResponseDto>(`/vendors/${name}/products`, { params }),

  /**
   * Get vendor reviews
   */
  getReviews: (
    name: string,
    params: PaginationParams
  ): Promise<ReviewSummaryDto[]> =>
    get<ReviewSummaryDto[]>(`/vendors/${name}/reviews`, { params }),

  // === Vendor Dashboard (authenticated) ===

  /**
   * Get current vendor profile
   */
  getMyProfile: (): Promise<VendorDetailDto> =>
    get<VendorDetailDto>("/vendors/me/profile"),

  /**
   * Update current vendor profile
   */
  updateMyProfile: (data: UpdateVendorDto): Promise<VendorDetailDto> =>
    put<VendorDetailDto, UpdateVendorDto>("/vendors/me/profile", data),

  /**
   * Get vendor dashboard stats
   */
  getMyStats: (): Promise<VendorDashboardStatsDto> =>
    get<VendorDashboardStatsDto>("/vendors/me/stats"),

  /**
   * Get current vendor products (includes inactive)
   */
  getMyProducts: (
    params: PaginationParams & { includeInactive?: boolean }
  ): Promise<ProductListItemDto[]> =>
    get<ProductListItemDto[]>("/vendors/me/products", { params }),

  /**
   * Get current vendor orders
   */
  getMyOrders: (
    params: PaginationParams & { status?: string }
  ): Promise<OrderResponseDto[]> =>
    get<OrderResponseDto[]>("/vendors/me/orders", { params }),

  /**
   * Get a specific vendor order
   */
  getMyOrder: (id: string): Promise<OrderResponseDto> =>
    get<OrderResponseDto>(`/vendors/me/orders/${id}`),

  /**
   * Get current vendor reviews
   */
  getMyReviews: (params: PaginationParams): Promise<ReviewListResponseDto> =>
    get<ReviewListResponseDto>("/vendors/me/reviews", { params }),

  /**
   * Store analytics for a rolling window
   */
  getMyAnalytics: (days = 30): Promise<VendorAnalytics> =>
    get<VendorAnalytics>("/vendors/me/analytics", { params: { days } }),
};

export default vendorsApi;
