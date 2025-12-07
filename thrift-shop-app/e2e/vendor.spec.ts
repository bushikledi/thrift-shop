/**
 * Vendor Dashboard E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Vendor Dashboard", () => {
  test.use({ storageState: "e2e/.auth/vendor.json" });

  test("should display vendor dashboard", async ({ page }) => {
    await page.goto("/vendor/dashboard");

    await expect(
      page.getByRole("heading", { name: /dashboard/i })
    ).toBeVisible();

    // Verify stats cards
    await expect(page.getByText(/total revenue/i)).toBeVisible();
    await expect(page.getByText(/orders/i)).toBeVisible();
    await expect(page.getByText(/products/i)).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.goto("/vendor/dashboard");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /products/i })
      .click();

    await expect(page).toHaveURL("/vendor/products");
    await expect(
      page.getByRole("heading", { name: /products/i })
    ).toBeVisible();
  });

  test("should navigate to orders page", async ({ page }) => {
    await page.goto("/vendor/dashboard");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /orders/i })
      .click();

    await expect(page).toHaveURL("/vendor/orders");
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/vendor/dashboard");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /settings/i })
      .click();

    await expect(page).toHaveURL("/vendor/settings");
  });
});

test.describe("Vendor Products", () => {
  test.use({ storageState: "e2e/.auth/vendor.json" });

  test("should display products list", async ({ page }) => {
    await page.goto("/vendor/products");

    await expect(
      page.getByRole("heading", { name: /products/i })
    ).toBeVisible();

    // Should have add product button
    await expect(
      page.getByRole("link", { name: /add product/i })
    ).toBeVisible();
  });

  test("should navigate to add product page", async ({ page }) => {
    await page.goto("/vendor/products");

    await page.getByRole("link", { name: /add product/i }).click();

    await expect(page).toHaveURL("/vendor/products/new");
    await expect(
      page.getByRole("heading", { name: /new product/i })
    ).toBeVisible();
  });

  test("should show product form fields", async ({ page }) => {
    await page.goto("/vendor/products/new");

    // Basic info
    await expect(page.getByLabel(/product name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/price/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/condition/i)).toBeVisible();
  });

  test("should validate product form", async ({ page }) => {
    await page.goto("/vendor/products/new");

    // Try to submit empty form
    await page.getByRole("button", { name: /create product/i }).click();

    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("should filter products", async ({ page }) => {
    await page.goto("/vendor/products");

    // Use status filter
    const statusFilter = page.getByRole("combobox", { name: /status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption("active");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should search products", async ({ page }) => {
    await page.goto("/vendor/products");

    const searchInput = page.getByPlaceholder(/search products/i);
    await searchInput.fill("test product");
    await searchInput.press("Enter");

    await page.waitForLoadState("networkidle");
  });
});

test.describe("Vendor Orders", () => {
  test.use({ storageState: "e2e/.auth/vendor.json" });

  test("should display orders list", async ({ page }) => {
    await page.goto("/vendor/orders");

    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();

    // Should have order table or list
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should filter orders by status", async ({ page }) => {
    await page.goto("/vendor/orders");

    // Find status tabs or filter
    const pendingTab = page.getByRole("tab", { name: /pending/i });
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should view order details", async ({ page }) => {
    await page.goto("/vendor/orders");

    // Click on first order
    const orderRow = page.getByRole("row").nth(1);
    if (await orderRow.isVisible()) {
      await orderRow.click();

      // Should navigate to order detail or open modal
      await expect(page.getByText(/order #/i)).toBeVisible();
    }
  });

  test("should update order status", async ({ page }) => {
    await page.goto("/vendor/orders");

    // Find an order with a status update button
    const updateButton = page
      .getByRole("button", { name: /mark as shipped/i })
      .first();

    if (await updateButton.isVisible()) {
      await updateButton.click();

      // Should show confirmation or update status
      await expect(page.getByText(/status updated|shipped/i)).toBeVisible();
    }
  });
});

test.describe("Vendor Settings", () => {
  test.use({ storageState: "e2e/.auth/vendor.json" });

  test("should display settings form", async ({ page }) => {
    await page.goto("/vendor/settings");

    // Store info section
    await expect(page.getByLabel(/business name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test("should update store information", async ({ page }) => {
    await page.goto("/vendor/settings");

    // Update business name
    const businessNameInput = page.getByLabel(/business name/i);
    await businessNameInput.clear();
    await businessNameInput.fill("Updated Store Name");

    // Save changes
    await page.getByRole("button", { name: /save/i }).click();

    // Should show success message
    await expect(page.getByText(/saved|updated/i)).toBeVisible();
  });
});
