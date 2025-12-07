/**
 * useAuth Hook Tests
 */
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/lib/store";

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
});

describe("useAuthStore", () => {
  describe("initial state", () => {
    it("has no user by default", () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("setUser", () => {
    it("sets user and updates authentication state", () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "CUSTOMER" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("setToken", () => {
    it("sets authentication token", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setToken("test-jwt-token");
      });

      expect(result.current.token).toBe("test-jwt-token");
    });
  });

  describe("login", () => {
    it("sets user and token together", () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "CUSTOMER" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.login(mockUser, "jwt-token");
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe("jwt-token");
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("logout", () => {
    it("clears user and token", () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "CUSTOMER" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.login(mockUser, "jwt-token");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("isRole", () => {
    it("checks user role correctly", () => {
      const { result } = renderHook(() => useAuthStore());

      const adminUser = {
        id: "admin-1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(adminUser);
      });

      expect(result.current.isRole("ADMIN")).toBe(true);
      expect(result.current.isRole("CUSTOMER")).toBe(false);
      expect(result.current.isRole("VENDOR")).toBe(false);
    });

    it("returns false when no user", () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isRole("ADMIN")).toBe(false);
    });
  });

  describe("isVendor", () => {
    it("identifies vendor users", () => {
      const { result } = renderHook(() => useAuthStore());

      const vendorUser = {
        id: "vendor-1",
        email: "vendor@example.com",
        firstName: "Vendor",
        lastName: "User",
        role: "VENDOR" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(vendorUser);
      });

      expect(result.current.isVendor()).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("identifies admin users", () => {
      const { result } = renderHook(() => useAuthStore());

      const adminUser = {
        id: "admin-1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(adminUser);
      });

      expect(result.current.isAdmin()).toBe(true);
    });
  });
});
