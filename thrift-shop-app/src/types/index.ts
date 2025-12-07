/**
 * Re-export OpenAPI generated types with convenience aliases
 */
export type { paths, components, operations } from "./openapi";

import type { components } from "./openapi";

// ============================================
// Schema type aliases for easier usage
// ============================================

// Auth
export type SignupDto = components["schemas"]["SignupDto"];
export type AuthResponseDto = components["schemas"]["AuthResponseDto"];
export type AuthUserDto = components["schemas"]["AuthUserDto"];
export type AuthVendorMinimalDto =
  components["schemas"]["AuthVendorMinimalDto"];
export type LogoutResponseDto = components["schemas"]["LogoutResponseDto"];
export type ForgotPasswordDto = components["schemas"]["ForgotPasswordDto"];
export type ForgotPasswordResponseDto =
  components["schemas"]["ForgotPasswordResponseDto"];
export type ResetPasswordDto = components["schemas"]["ResetPasswordDto"];
export type ResetPasswordResponseDto =
  components["schemas"]["ResetPasswordResponseDto"];
export type ChangePasswordDto = components["schemas"]["ChangePasswordDto"];
export type ChangePasswordResponseDto =
  components["schemas"]["ChangePasswordResponseDto"];
export type MeResponseDto = components["schemas"]["MeResponseDto"];
export type RefreshTokenResponseDto =
  components["schemas"]["RefreshTokenResponseDto"];

// Users
export type UserProfileResponseDto =
  components["schemas"]["UserProfileResponseDto"];
export type UserVendorProfileDto =
  components["schemas"]["UserVendorProfileDto"];
export type UpdateUserDto = components["schemas"]["UpdateUserDto"];
export type SavedItemResponseDto =
  components["schemas"]["SavedItemResponseDto"];

// Products
export type ProductListItemDto = components["schemas"]["ProductListItemDto"];
export type ProductDetailDto = components["schemas"]["ProductDetailDto"];
export type CreateProductDto = components["schemas"]["CreateProductDto"];
export type UpdateProductDto = components["schemas"]["UpdateProductDto"];
export type PaginatedProductsResponseDto =
  components["schemas"]["PaginatedProductsResponseDto"];
export type PaginationMetaDto = components["schemas"]["PaginationMetaDto"];

// Categories
export type CategoryResponseDto = components["schemas"]["CategoryResponseDto"];
export type CategorySummaryDto = components["schemas"]["CategorySummaryDto"];
export type CategoryWithParentDto =
  components["schemas"]["CategoryWithParentDto"];
export type CreateCategoryDto = components["schemas"]["CreateCategoryDto"];
export type UpdateCategoryDto = components["schemas"]["UpdateCategoryDto"];

// Vendors
export type VendorDetailDto = components["schemas"]["VendorDetailDto"];
export type VendorSummaryDto = components["schemas"]["VendorSummaryDto"];
export type VendorDashboardStatsDto =
  components["schemas"]["VendorDashboardStatsDto"];
export type UpdateVendorDto = components["schemas"]["UpdateVendorDto"];
export type PayoutDetailsDto = components["schemas"]["PayoutDetailsDto"];

// Cart
export type CartResponseDto = components["schemas"]["CartResponseDto"];
export type CartItemDto = components["schemas"]["CartItemDto"];
export type CartProductDto = components["schemas"]["CartProductDto"];
export type AddToCartDto = components["schemas"]["AddToCartDto"];
export type UpdateCartItemDto = components["schemas"]["UpdateCartItemDto"];

// Orders
export type OrderResponseDto = components["schemas"]["OrderResponseDto"];
export type OrderItemResponseDto =
  components["schemas"]["OrderItemResponseDto"];
export type OrderItemProductDto = components["schemas"]["OrderItemProductDto"];
export type OrderVendorDto = components["schemas"]["OrderVendorDto"];
export type OrderCustomerDto = components["schemas"]["OrderCustomerDto"];
export type CreateOrderDto = components["schemas"]["CreateOrderDto"];
export type UpdateOrderStatusDto =
  components["schemas"]["UpdateOrderStatusDto"];
export type ShippingAddressDto = components["schemas"]["ShippingAddressDto"];
export type GuestInfoDto = components["schemas"]["GuestInfoDto"];
export type AddressDto = components["schemas"]["AddressDto"];

// Reviews
export type ReviewResponseDto = components["schemas"]["ReviewResponseDto"];
export type ReviewSummaryDto = components["schemas"]["ReviewSummaryDto"];
export type ReviewListResponseDto =
  components["schemas"]["ReviewListResponseDto"];
export type CreateReviewDto = components["schemas"]["CreateReviewDto"];
export type UpdateReviewDto = components["schemas"]["UpdateReviewDto"];

// Media
export type MediaResponseDto = components["schemas"]["MediaResponseDto"];
export type CreateMediaDto = components["schemas"]["CreateMediaDto"];

// Search
export type SearchResponseDto = components["schemas"]["SearchResponseDto"];
export type ProductSearchResultDto =
  components["schemas"]["ProductSearchResultDto"];
export type VendorSearchResultDto =
  components["schemas"]["VendorSearchResultDto"];
export type CategorySearchResultDto =
  components["schemas"]["CategorySearchResultDto"];
export type TrendingResponseDto = components["schemas"]["TrendingResponseDto"];

// Admin
export type AdminStatsResponseDto =
  components["schemas"]["AdminStatsResponseDto"];
export type AdminUpdateUserDto = components["schemas"]["AdminUpdateUserDto"];
export type AdminUpdateVendorDto =
  components["schemas"]["AdminUpdateVendorDto"];
export type AdminReviewResponseDto =
  components["schemas"]["AdminReviewResponseDto"];
export type AuditLogResponseDto = components["schemas"]["AuditLogResponseDto"];

// Notifications
export type SendNotificationDto = components["schemas"]["SendNotificationDto"];
export type SendEmailDto = components["schemas"]["SendEmailDto"];
export type NotificationResponseDto =
  components["schemas"]["NotificationResponseDto"];

// Health
export type HealthResponseDto = components["schemas"]["HealthResponseDto"];

// Error
export type ErrorResponseDto = components["schemas"]["ErrorResponseDto"];

// ============================================
// Enums extracted from OpenAPI
// ============================================
export const UserRole = {
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProductCondition = {
  LIKE_NEW: "LIKE_NEW",
  VERY_GOOD: "VERY_GOOD",
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
} as const;
export type ProductCondition =
  (typeof ProductCondition)[keyof typeof ProductCondition];

export const ProductSort = {
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  NEWEST: "newest",
  POPULAR: "popular",
} as const;
export type ProductSort = (typeof ProductSort)[keyof typeof ProductSort];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  COD: "COD",
  STRIPE: "STRIPE",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PayoutMethod = {
  BANK: "bank",
  PAYPAL: "paypal",
  MANUAL: "manual",
} as const;
export type PayoutMethod = (typeof PayoutMethod)[keyof typeof PayoutMethod];

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================
// API request parameter types
// ============================================
export interface ProductsListParams {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  vendorId?: string;
  condition?: ProductCondition;
  brand?: string;
  color?: string;
  size?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface ReviewsListParams {
  vendorId?: string;
  productId?: string;
  userId?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface SearchParams {
  q?: string;
  types?: string;
  page?: number;
  limit?: number;
}

export interface AdminUsersParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminVendorsParams {
  search?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminOrdersParams {
  status?: OrderStatus;
  vendorId?: string;
  buyerId?: string;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
