/**
 * Authentication Hooks
 * React Query hooks for auth operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi, LoginDto } from "@/lib/api/auth";
import { cartApi } from "@/lib/api/cart";
import { queryKeys } from "./queryKeys";
import type {
  SignupDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthUserDto,
} from "@/types";
import { ApiError } from "@/lib/apiClient";
import { logger } from "@/lib/logger";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Signup mutation
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupDto) => authApi.signup(data),
    onSuccess: (response: AuthResponseDto) => {
      queryClient.setQueryData(queryKeys.auth.me(), { user: response.user });
      logger.info("User signed up successfully", { userId: response.user.id });
      toast.success("Account created successfully!");

      // Redirect based on role
      if (response.user.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    },
    onError: (error: ApiError) => {
      logger.error("Signup failed", { error: error.message });
      toast.error(error.message || "Failed to create account");
    },
  });
}

/**
 * Login mutation
 * Note: Does not redirect automatically - let the calling component handle redirects
 * based on user role and any redirect URL parameters
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (response: AuthResponseDto) => {
      // Update React Query cache
      queryClient.setQueryData(queryKeys.auth.me(), { user: response.user });
      
      // Update auth store to keep it in sync
      useAuthStore.setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      logger.info("User logged in", { userId: response.user.id });
      logger.setUser({ id: response.user.id, email: response.user.email });
      toast.success("Welcome back!");
    },
    onError: (error: ApiError) => {
      logger.error("Login failed", { error: error.message });
      toast.error(error.message || "Invalid credentials");
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { clearCart } = useCartStore();

  return useMutation({
    mutationFn: async () => {
      // Clear cart on backend first
      try {
        await cartApi.clear();
      } catch (error) {
        // Log but don't fail - cart might not exist
        logger.debug("Cart clear failed during logout", { error });
      }
      // Then logout
      return authApi.logout();
    },
    onSuccess: () => {
      // Clear local cart state
      clearCart();
      queryClient.clear();
      logger.info("User logged out");
      logger.setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      clearCart();
      queryClient.clear();
      router.push("/");
    },
  });
}

/**
 * Forgot password mutation
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordDto) => authApi.forgotPassword(data),
    onSuccess: () => {
      toast.success(
        "If an account exists, a reset link has been sent to your email"
      );
    },
    onError: (error: ApiError) => {
      // Don't reveal if email exists
      toast.success(
        "If an account exists, a reset link has been sent to your email"
      );
      logger.error("Forgot password request failed", { error: error.message });
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordDto) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success(
        "Password reset successfully. Please login with your new password."
      );
      router.push("/login");
    },
    onError: (error: ApiError) => {
      toast.error(
        error.message || "Failed to reset password. The link may have expired."
      );
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: () => authApi.refresh(),
    onError: (error: ApiError) => {
      logger.warn("Token refresh failed", { error: error.message });
    },
  });
}

/**
 * Helper hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { data, isLoading } = useCurrentUser();
  if (isLoading) return false;
  return !!data?.user;
}

/**
 * Helper hook to get user data directly
 */
export function useUser(): AuthUserDto | null {
  const { data } = useCurrentUser();
  return data?.user ?? null;
}

/**
 * Helper hook to check user role
 */
export function useUserRole(): "CUSTOMER" | "VENDOR" | "ADMIN" | null {
  const user = useUser();
  return user?.role ?? null;
}

/**
 * Helper hook to check if user is vendor
 */
export function useIsVendor(): boolean {
  const role = useUserRole();
  return role === "VENDOR";
}

/**
 * Helper hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const role = useUserRole();
  return role === "ADMIN";
}
