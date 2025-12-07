/**
 * Homepage E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display hero section", async ({ page }) => {
    await page.goto("/");

    // Verify hero content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /shop now/i })).toBeVisible();
  });

  test("should display featured products", async ({ page }) => {
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByText(/featured/i)).toBeVisible();

    // Verify product cards are displayed
    const productCards = page.locator("[data-testid='product-card']");
    await expect(productCards.first()).toBeVisible();
  });

  test("should display category grid", async ({ page }) => {
    await page.goto("/");

    // Verify categories section
    await expect(page.getByText(/categories/i)).toBeVisible();
  });

  test("should navigate to shop page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /shop now/i }).click();

    await expect(page).toHaveURL("/shop");
  });

  test("should have working header navigation", async ({ page }) => {
    await page.goto("/");

    // Test navigation links
    const nav = page.getByRole("navigation");

    await nav.getByRole("link", { name: /shop/i }).click();
    await expect(page).toHaveURL("/shop");

    await nav.getByRole("link", { name: /categories/i }).click();
    await expect(page).toHaveURL("/categories");

    await nav.getByRole("link", { name: /vendors/i }).click();
    await expect(page).toHaveURL("/vendors");
  });

  test("should open search modal", async ({ page }) => {
    await page.goto("/");

    // Click search button in header
    await page.getByRole("button", { name: /search/i }).click();

    // Verify search modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();
  });

  test("should display footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    // Verify footer links
    await expect(footer.getByRole("link", { name: /about/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /contact/i })).toBeVisible();
  });
});
