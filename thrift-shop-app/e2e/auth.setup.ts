/**
 * Authentication Setup for Playwright Tests
 * This file handles login and saves authentication state for reuse
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");
const vendorAuthFile = path.join(__dirname, "../.auth/vendor.json");
const adminAuthFile = path.join(__dirname, "../.auth/admin.json");

// Test credentials - these should come from environment variables in CI
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
};

const TEST_VENDOR = {
  email: process.env.TEST_VENDOR_EMAIL || "vendor@example.com",
  password: process.env.TEST_VENDOR_PASSWORD || "VendorPassword123!",
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@example.com",
  password: process.env.TEST_ADMIN_PASSWORD || "AdminPassword123!",
};

setup("authenticate as user", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in login form
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit form
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for successful redirect
  await expect(page).toHaveURL("/");

  // Verify logged in state
  await expect(page.getByText(/account/i)).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup("authenticate as vendor", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill(TEST_VENDOR.email);
  await page.getByLabel(/password/i).fill(TEST_VENDOR.password);

  await page.getByRole("button", { name: /sign in/i }).click();

  // Vendors may redirect to vendor dashboard
  await expect(page).toHaveURL(/\/(vendor\/dashboard)?$/);

  await page.context().storageState({ path: vendorAuthFile });
});

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill(TEST_ADMIN.email);
  await page.getByLabel(/password/i).fill(TEST_ADMIN.password);

  await page.getByRole("button", { name: /sign in/i }).click();

  // Admins may redirect to admin dashboard
  await expect(page).toHaveURL(/\/(admin\/dashboard)?$/);

  await page.context().storageState({ path: adminAuthFile });
});
