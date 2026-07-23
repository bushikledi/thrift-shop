/**
 * API Services Index
 * Central export for all API services
 */

export { authApi } from "./auth";
export { productsApi } from "./products";
export { categoriesApi } from "./categories";
export { vendorsApi } from "./vendors";
export { cartApi } from "./cart";
export { ordersApi } from "./orders";
export { usersApi } from "./users";
export { reviewsApi } from "./reviews";
export { searchApi } from "./search";
export { mediaApi } from "./media";
export { adminApi } from "./admin";
export { notificationsApi } from "./notifications";
export { healthApi } from "./health";

// Re-export API client utilities
export { apiClient, ApiError, get, post, put, del, upload } from "../apiClient";
export * from "./promo";
