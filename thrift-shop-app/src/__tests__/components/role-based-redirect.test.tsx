/**
 * RoleBasedRedirect tests.
 *
 * The guard used to bounce admins and vendors off the *entire* storefront,
 * which is why "view product" and "view storefront" links from the admin and
 * vendor panels always landed back on the dashboard. It must now only take
 * over the customer-only routes.
 */
import { render, screen } from "@testing-library/react";
import { RoleBasedRedirect } from "@/components/shared/auth-guard";
import { useAuthStore } from "@/lib/stores/auth-store";

const replace = jest.fn();
let pathname = "/shop";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

function signedInAs(role: "ADMIN" | "VENDOR" | "CUSTOMER" | null) {
  mockedUseAuthStore.mockReturnValue({
    user: role ? { id: "u1", role } : null,
    isAuthenticated: role !== null,
    isLoading: false,
  });
}

function renderAt(path: string) {
  pathname = path;
  return render(
    <RoleBasedRedirect>
      <p>storefront</p>
    </RoleBasedRedirect>
  );
}

describe("RoleBasedRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it.each(["/", "/shop", "/products/some-slug", "/vendors/boho-bazaar"])(
    "lets an admin browse %s",
    (path) => {
      signedInAs("ADMIN");
      renderAt(path);
      expect(screen.getByText("storefront")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    }
  );

  it("lets a vendor open a product page", () => {
    signedInAs("VENDOR");
    renderAt("/products/some-slug");
    expect(screen.getByText("storefront")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it.each(["/cart", "/checkout", "/account", "/account/profile", "/orders"])(
    "sends an admin from %s to the admin dashboard",
    (path) => {
      signedInAs("ADMIN");
      renderAt(path);
      expect(replace).toHaveBeenCalledWith("/admin/dashboard");
      expect(screen.queryByText("storefront")).not.toBeInTheDocument();
    }
  );

  it("sends a vendor from the cart to the vendor dashboard", () => {
    signedInAs("VENDOR");
    renderAt("/cart");
    expect(replace).toHaveBeenCalledWith("/vendor/dashboard");
  });

  it("leaves customers alone on customer-only routes", () => {
    signedInAs("CUSTOMER");
    renderAt("/checkout");
    expect(screen.getByText("storefront")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves signed-out visitors alone", () => {
    signedInAs(null);
    renderAt("/cart");
    expect(screen.getByText("storefront")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not match a route that merely starts with the same letters", () => {
    signedInAs("ADMIN");
    renderAt("/cartography");
    expect(screen.getByText("storefront")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
