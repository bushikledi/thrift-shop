/**
 * Authentication Guard Component
 * Protects routes requiring authentication
 */
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { LoadingSpinner } from "@/components/shared/loading";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackUrl?: string;
}

/**
 * Protects routes that require authentication
 * Redirects to login if not authenticated
 * Optionally checks for specific user roles
 */
export function AuthGuard({
  children,
  requiredRoles,
  fallbackUrl = "/login",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Encode the current path to redirect back after login
        const redirectUrl = encodeURIComponent(pathname);
        router.replace(`${fallbackUrl}?redirect=${redirectUrl}`);
        return;
      }

      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(
          (role) => user?.role === role
        );

        if (!hasRequiredRole) {
          // User doesn't have required role, redirect to home or 403
          router.replace("/unauthorized");
        }
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredRoles,
    router,
    pathname,
    fallbackUrl,
  ]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => user?.role === role);
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Guard for guest-only routes (login, signup)
 * Redirects authenticated users to their appropriate dashboard based on role
 */
interface GuestGuardProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

export function GuestGuard({ children, redirectUrl }: GuestGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else if (user.role === "VENDOR") {
        router.replace("/vendor/dashboard");
      } else {
        router.replace(redirectUrl || "/");
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Guard for vendor-only routes
 */
interface VendorGuardProps {
  children: React.ReactNode;
}

export function VendorGuard({ children }: VendorGuardProps) {
  // Only VENDOR role can access vendor pages
  // Admin should use admin dashboard instead
  return (
    <AuthGuard requiredRoles={["VENDOR"] as UserRole[]}>{children}</AuthGuard>
  );
}

/**
 * Guard for admin-only routes
 */
interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  return (
    <AuthGuard requiredRoles={["ADMIN"] as UserRole[]}>{children}</AuthGuard>
  );
}

/**
 * Hook to check if user has specific permissions
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuthStore();

  return {
    isAuthenticated,
    isAdmin: user?.role === "ADMIN",
    isVendor: user?.role === "VENDOR",
    isBuyer: user?.role === "CUSTOMER",
    hasRole: (role: UserRole) => user?.role === role,
    hasAnyRole: (roles: UserRole[]) =>
      roles.some((role) => user?.role === role),
    user,
  };
}

/**
 * Guard that redirects admin/vendor users to their respective dashboards
 * Used to prevent admin/vendor from accessing customer-only pages
 */
interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

export function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else if (user.role === "VENDOR") {
        router.replace("/vendor/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect admin/vendor users
  if (isAuthenticated && user) {
    if (user.role === "ADMIN" || user.role === "VENDOR") {
      return null;
    }
  }

  return <>{children}</>;
}

export default AuthGuard;
