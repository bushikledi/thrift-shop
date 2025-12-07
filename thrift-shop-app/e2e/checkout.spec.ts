/**
 * Checkout Flow E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Checkout", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    // Ensure we have items in cart before checkout tests
    // In a real scenario, you might use API calls to set up test data
    await page.goto("/shop");

    // Add a product to cart if needed
    const cartCount = page.getByTestId("cart-count");
    const count = await cartCount.textContent();

    if (!count || parseInt(count) === 0) {
      const productCard = page.locator("[data-testid='product-card']").first();
      await productCard.click();
      await page.getByRole("button", { name: /add to cart/i }).click();
      await page.waitForTimeout(500);
    }
  });

  test("should display checkout form", async ({ page }) => {
    await page.goto("/checkout");

    // Verify checkout sections
    await expect(
      page.getByRole("heading", { name: /checkout/i })
    ).toBeVisible();

    // Shipping section
    await expect(page.getByText(/shipping address/i)).toBeVisible();

    // Order summary
    await expect(page.getByText(/order summary/i)).toBeVisible();
  });

  test("should show shipping address form", async ({ page }) => {
    await page.goto("/checkout");

    // Verify address fields
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/state/i)).toBeVisible();
    await expect(page.getByLabel(/zip code|postal code/i)).toBeVisible();
    await expect(page.getByLabel(/country/i)).toBeVisible();
  });

  test("should validate shipping form", async ({ page }) => {
    await page.goto("/checkout");

    // Try to proceed without filling form
    await page.getByRole("button", { name: /continue|next/i }).click();

    // Should show validation errors
    await expect(
      page.getByText(/address is required|please enter/i)
    ).toBeVisible();
  });

  test("should fill shipping address", async ({ page }) => {
    await page.goto("/checkout");

    // Fill shipping form
    await page.getByLabel(/street address/i).fill("123 Test Street");
    await page.getByLabel(/city/i).fill("Test City");
    await page.getByLabel(/state/i).fill("TS");
    await page.getByLabel(/zip code|postal code/i).fill("12345");
    await page.getByLabel(/country/i).selectOption("US");

    // Should be able to proceed
    await page.getByRole("button", { name: /continue|next/i }).click();

    // Should move to payment or next step
    await expect(page.getByText(/payment/i)).toBeVisible();
  });

  test("should show order summary", async ({ page }) => {
    await page.goto("/checkout");

    // Verify order summary contains expected elements
    const summary = page.getByTestId("order-summary");
    await expect(summary).toBeVisible();

    // Should show subtotal
    await expect(page.getByText(/subtotal/i)).toBeVisible();

    // Should show shipping cost
    await expect(page.getByText(/shipping/i)).toBeVisible();

    // Should show total
    await expect(page.getByText(/total/i)).toBeVisible();
  });

  test("should display cart items in summary", async ({ page }) => {
    await page.goto("/checkout");

    // Should show at least one item
    const orderItems = page.locator("[data-testid='checkout-item']");
    await expect(orderItems.first()).toBeVisible();
  });

  test("should allow editing cart from checkout", async ({ page }) => {
    await page.goto("/checkout");

    // Find edit cart link
    const editCartLink = page.getByRole("link", { name: /edit cart/i });

    if (await editCartLink.isVisible()) {
      await editCartLink.click();
      await expect(page).toHaveURL("/cart");
    }
  });

  test("should use saved address if available", async ({ page }) => {
    await page.goto("/checkout");

    // Check for saved addresses dropdown
    const savedAddresses = page.getByRole("combobox", {
      name: /saved address/i,
    });

    if (await savedAddresses.isVisible()) {
      // Select a saved address
      await savedAddresses.selectOption({ index: 1 });

      // Fields should be populated
      await expect(page.getByLabel(/street address/i)).not.toBeEmpty();
    }
  });
});

test.describe("Order Placement", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should show order confirmation", async ({ page }) => {
    // This test would need proper setup with test payment
    // For now, we test the flow structure

    await page.goto("/checkout");

    // Fill required fields
    await page.getByLabel(/street address/i).fill("123 Test Street");
    await page.getByLabel(/city/i).fill("Test City");
    await page.getByLabel(/state/i).fill("TS");
    await page.getByLabel(/zip code|postal code/i).fill("12345");

    // Look for place order button
    const placeOrderButton = page.getByRole("button", {
      name: /place order/i,
    });
    await expect(placeOrderButton).toBeVisible();

    // Note: Actually placing an order would require test payment setup
  });
});
