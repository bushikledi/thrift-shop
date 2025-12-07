/**
 * Hooks Index
 * Central export for all React Query hooks
 */

// Query Keys
export { queryKeys } from "./queryKeys";

// Auth
export {
  useCurrentUser,
  useSignup,
  useLogin,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  useRefreshToken,
  useIsAuthenticated,
  useUser,
  useUserRole,
  useIsVendor,
  useIsAdmin,
} from "./useAuth";

// Products
export {
  useProducts,
  useInfiniteProducts,
  useProduct,
  useFeaturedProducts,
  useRelatedProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  usePrefetchProduct,
} from "./useProducts";

// Categories
export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useFlatCategories,
  useCategoryOptions,
} from "./useCategories";

// Vendors
export {
  useVendors,
  useVendor,
  useVendorProducts,
  useVendorReviews,
  useMyVendorProfile,
  useUpdateMyVendorProfile,
  useMyVendorStats,
  useMyVendorProducts,
  useMyVendorOrders,
  useMyVendorOrder,
  useMyVendorReviews,
  usePrefetchVendor,
} from "./useVendors";

// Cart
export {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCartItemCount,
  useCartSubtotal,
  useIsInCart,
} from "./useCart";

// Orders
export {
  useCheckout,
  useTrackOrder,
  useOrder,
  useVendorOrders,
  useUpdateOrderStatus,
  getOrderStatusColor,
  getPaymentStatusColor,
} from "./useOrders";

// Users
export {
  useUserProfile,
  useUpdateUserProfile,
  useSavedItems,
  useSaveItem,
  useRemoveSavedItem,
  useToggleSavedItem,
  useUserOrders,
} from "./useUsers";

// Reviews
export {
  useReviews,
  useReview,
  useProductReviews,
  useVendorReviews as useVendorReviewsList,
  useMyReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  renderStars,
} from "./useReviews";

// Search
export {
  useSearch,
  useSearchSuggestions,
  useTrending,
  useDebouncedSearch,
} from "./useSearch";

// Media
export {
  useMedia,
  useMediaById,
  useMediaByOwner,
  useUploadMedia,
  useUploadMultipleMedia,
  useDeleteMedia,
  useGetPresignedUrl,
} from "./useMedia";

// Admin
export {
  useAdminStats,
  useAdminUsers,
  useAdminUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminVendors,
  useAdminVendor,
  useAdminUpdateVendor,
  useAdminVerifyVendor,
  useAdminOrders,
  useAdminOrder,
  useAdminProducts,
  useAdminToggleProductFeatured,
  useAdminToggleProductActive,
  useAdminReviews,
  useAdminDeleteReview,
  useAdminAuditLogs,
} from "./useAdmin";

// Health
export {
  useHealthCheck,
  useDatabaseHealth,
  useRedisHealth,
  useObjectStoreHealth,
  useAllHealthChecks,
} from "./useHealth";
