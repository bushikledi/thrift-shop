/**
 * Authentication Store
 * Manages authentication state using Zustand
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi, type LoginDto } from "@/lib/api/auth";
import { cartApi } from "@/lib/api/cart";
import { useCartStore } from "@/lib/stores/cart-store";
import { logger } from "@/lib/logger";
import type { AuthUserDto, SignupDto, UserRole } from "@/types";

interface AuthState {
  // State
  user: AuthUserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  signup: (data: SignupDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<AuthUserDto>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true, // Start as loading to check auth on init
      error: null,

      // Login action
      login: async (credentials: LoginDto) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(credentials);
          const { user } = response;

          set({
            user,
            accessToken: null, // Auth is cookie-based
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          logger.info("User logged in successfully", { userId: user.id });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Login failed";
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // Signup action
      signup: async (data: SignupDto) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.signup(data);
          const { user } = response;

          set({
            user,
            accessToken: null, // Auth is cookie-based
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          logger.info("User signed up successfully", { userId: user.id });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Signup failed";
          set({
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });

        try {
          // Clear cart on backend first
          try {
            await cartApi.clear();
          } catch (error) {
            // Log but don't fail - cart might not exist
            logger.debug("Cart clear failed during logout", { error });
          }

          // Auth is cookie-based (accessToken is always null client-side), so
          // always hit the API to clear the httpOnly cookie. Previously this
          // was gated on `accessToken`, so the cookie was never cleared and a
          // refresh logged the user straight back in.
          await authApi.logout();
        } catch (error) {
          // Log but don't fail - we still want to clear local state
          logger.warn("Logout API call failed", { error });
        } finally {
          // Clear local cart state
          useCartStore.getState().clearCart();
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          logger.info("User logged out");
        }
      },

      // Refresh token action
      refreshToken: async () => {
        try {
          await authApi.refresh();
          // Cookie-based auth, no accessToken to store

          set({
            accessToken: null,
            isAuthenticated: true,
          });

          logger.debug("Token refreshed successfully");
        } catch (error) {
          // If refresh fails, log the user out
          logger.warn("Token refresh failed, logging out");
          await get().logout();
          throw error;
        }
      },

      // Check current auth status
      checkAuth: async () => {
        const { user, isAuthenticated } = get();

        // If no user stored, we're not authenticated
        if (!user || !isAuthenticated) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          // Verify auth by getting current user from API (cookie-based auth)
          const response = await authApi.me();

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          logger.debug("Auth check successful", { userId: response.user.id });
        } catch (error) {
          // Auth check failed - cookie might be expired or invalid
          // Try refreshing the token
          try {
            await get().refreshToken();
            const response = await authApi.me();

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            logger.debug("Auth refreshed and verified", { userId: response.user.id });
          } catch (refreshError) {
            // Refresh also failed, clear auth state
            logger.warn("Auth check failed, clearing auth state", { error: refreshError });
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        }
      },

      // Update user data locally
      updateUser: (userData: Partial<AuthUserDto>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "thrift-shop-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logger.warn("Failed to rehydrate auth state", { error });
          return;
        }

        // After rehydration, check if the stored auth is still valid
        if (state) {
          // If we have a user stored, verify it's still valid with the backend
          // This is important for cookie-based auth to ensure the session is still active
          if (state.user && state.isAuthenticated) {
            // Verify auth is still valid by calling the API
            // This will update the user data if needed or clear if invalid
            state.checkAuth().catch((err) => {
              // Silently handle errors - checkAuth already handles clearing state
              logger.debug("Auth rehydration check failed", { error: err });
            });
          } else {
            // No user stored, ensure loading state is cleared
            // Call checkAuth which will properly set the state
            state.checkAuth();
          }
        }
      },
    }
  )
);

// Type helper for user role checks
export function hasRole(user: AuthUserDto | null, role: UserRole): boolean {
  return user?.role === role;
}

export function hasAnyRole(
  user: AuthUserDto | null,
  roles: UserRole[]
): boolean {
  return roles.some((role) => user?.role === role);
}

export default useAuthStore;
