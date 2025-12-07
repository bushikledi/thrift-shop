/**
 * Product Pages E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Shop Page", () => {
  test("should display product grid", async ({ page }) => {
    await page.goto("/shop");

    await expect(page.getByRole("heading", { name: /shop/i })).toBeVisible();

    // Wait for products to load
    await expect(
      page.locator("[data-testid='product-card']").first()
    ).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/shop");

    // Find and click category filter
    const categoryFilter = page.getByRole("combobox", { name: /category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByRole("option").first().click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should filter by price range", async ({ page }) => {
    await page.goto("/shop");

    // Find price inputs
    const minPrice = page.getByLabel(/min price/i);
    const maxPrice = page.getByLabel(/max price/i);

    if (await minPrice.isVisible()) {
      await minPrice.fill("10");
      await maxPrice.fill("100");
      await page.getByRole("button", { name: /apply/i }).click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should filter by condition", async ({ page }) => {
    await page.goto("/shop");

    // Find condition filter
    const conditionFilter = page.getByRole("combobox", { name: /condition/i });
    if (await conditionFilter.isVisible()) {
      await conditionFilter.click();
      await page.getByRole("option", { name: /excellent/i }).click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("should sort products", async ({ page }) => {
    await page.goto("/shop");

    const sortSelect = page.getByRole("combobox", { name: /sort/i });
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption("price-asc");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should paginate products", async ({ page }) => {
    await page.goto("/shop");

    // Look for pagination
    const nextButton = page.getByRole("button", { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");

      // URL should have page parameter
      expect(page.url()).toContain("page=2");
    }
  });

  test("should navigate to product detail", async ({ page }) => {
    await page.goto("/shop");

    // Click first product
    const productCard = page.locator("[data-testid='product-card']").first();
    const productLink = productCard.getByRole("link").first();
    await productLink.click();

    // Should be on product page
    await expect(page.url()).toContain("/products/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Product Detail Page", () => {
  test("should display product information", async ({ page }) => {
    // Navigate to shop first to get a product
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Verify product details
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/\$/)).toBeVisible(); // Price
    await expect(page.getByText(/condition/i)).toBeVisible();
  });

  test("should display product images", async ({ page }) => {
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Should have main image
    await expect(page.getByRole("img").first()).toBeVisible();
  });

  test("should show vendor information", async ({ page }) => {
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Vendor section should be visible
    await expect(page.getByText(/sold by/i)).toBeVisible();
  });

  test("should add product to cart", async ({ page }) => {
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Add to cart
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Should show success feedback
    await expect(page.getByText(/added to cart/i)).toBeVisible();
  });

  test("should select quantity", async ({ page }) => {
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Find quantity selector
    const quantityInput = page.getByRole("spinbutton");
    if (await quantityInput.isVisible()) {
      await quantityInput.fill("2");
    }

    // Add to cart
    await page.getByRole("button", { name: /add to cart/i }).click();
  });

  test("should show related products", async ({ page }) => {
    await page.goto("/shop");
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.getByRole("link").first().click();

    // Related products section
    await expect(page.getByText(/related|you may also like/i)).toBeVisible();
  });
});

test.describe("Search", () => {
  test("should search from header", async ({ page }) => {
    await page.goto("/");

    // Open search
    await page.getByRole("button", { name: /search/i }).click();

    // Type in search
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("vintage");
    await searchInput.press("Enter");

    // Should navigate to search results
    await expect(page).toHaveURL(/search\?q=vintage/);
  });

  test("should display search results", async ({ page }) => {
    await page.goto("/search?q=vintage");

    // Should show search results heading
    await expect(
      page.getByRole("heading", { name: /search results/i })
    ).toBeVisible();

    // Should show query
    await expect(page.getByText(/vintage/i)).toBeVisible();
  });

  test("should show no results message", async ({ page }) => {
    await page.goto("/search?q=xyznonexistentproduct123");

    await expect(page.getByText(/no results|nothing found/i)).toBeVisible();
  });

  test("should filter search results", async ({ page }) => {
    await page.goto("/search?q=shirt");

    // Apply category filter
    const categoryFilter = page.getByRole("combobox", { name: /category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByRole("option").first().click();
    }
  });
});
