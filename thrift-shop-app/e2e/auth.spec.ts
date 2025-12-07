/**
 * Authentication Flow E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("heading", { name: /sign in/i })
      ).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in/i })
      ).toBeVisible();
    });

    test("should show validation errors for empty form", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("invalid@example.com");
      await page.getByLabel(/password/i).fill("wrongpassword");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test("should navigate to signup page", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("link", { name: /sign up/i }).click();

      await expect(page).toHaveURL("/signup");
    });

    test("should navigate to forgot password", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("link", { name: /forgot password/i }).click();

      await expect(page).toHaveURL("/forgot-password");
    });
  });

  test.describe("Signup", () => {
    test("should display signup form", async ({ page }) => {
      await page.goto("/signup");

      await expect(
        page.getByRole("heading", { name: /create account/i })
      ).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });

    test("should show validation errors", async ({ page }) => {
      await page.goto("/signup");

      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/signup");

      await page.getByLabel(/^password$/i).fill("weak");

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible();
    });

    test("should validate password match", async ({ page }) => {
      await page.goto("/signup");

      await page.getByLabel(/^password$/i).fill("StrongPassword123!");
      await page.getByLabel(/confirm password/i).fill("DifferentPassword123!");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test("should navigate to login page", async ({ page }) => {
      await page.goto("/signup");

      await page.getByRole("link", { name: /sign in/i }).click();

      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Logout", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("should logout user", async ({ page }) => {
      await page.goto("/");

      // Open user menu
      await page.getByRole("button", { name: /account/i }).click();

      // Click logout
      await page.getByRole("button", { name: /logout/i }).click();

      // Verify logged out
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    });
  });
});
