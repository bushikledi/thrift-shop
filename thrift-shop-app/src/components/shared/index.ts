/**
 * Shared Components Index
 * Re-exports all shared components for easy imports
 */

// Loading components
export {
  LoadingSpinner,
  LoadingSkeleton,
  CardSkeleton,
  CardGridSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  DetailPageSkeleton,
  PageLoadingOverlay,
  InlineLoading,
  ButtonLoading,
  CartItemSkeleton,
  CartPageSkeleton,
} from "./loading";

// Error handling
export {
  ErrorBoundary,
  useErrorHandler,
  withErrorBoundary,
} from "./error-boundary";

// Auth guards
export {
  AuthGuard,
  GuestGuard,
  VendorGuard,
  AdminGuard,
  RoleBasedRedirect,
  usePermissions,
} from "./auth-guard";

// Pagination
export { Pagination } from "./pagination";

// Empty state
export {
  EmptyState,
  EmptySearchResults,
  EmptyProducts,
  EmptyCart,
  EmptyWishlist,
  EmptyOrders,
  EmptyNotifications,
  EmptyVendorProducts,
  EmptyVendorOrders,
  EmptyReviews,
  EmptyUsers,
} from "./empty-state";

// Confirmation modal
export {
  ConfirmationModal,
  useConfirmation,
  DeleteConfirmation,
  LogoutConfirmation,
  CancelOrderConfirmation,
} from "./confirmation-modal";
