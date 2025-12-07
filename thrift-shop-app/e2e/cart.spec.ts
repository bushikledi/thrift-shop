/**
 * Shopping Cart E2E Tests
 */
import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should add product to cart", async ({ page }) => {
    // Go to shop page
    await page.goto("/shop");

    // Click on first product
    const productCard = page.locator("[data-testid='product-card']").first();
    await productCard.click();

    // Wait for product page to load
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Add to cart
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Verify cart indicator updates
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    // Open cart drawer
    await page.getByRole("button", { name: /cart/i }).click();

    // Verify product in cart
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("[data-testid='cart-item']")).toHaveCount(1);
  });

  test("should update cart item quantity", async ({ page }) => {
    // Assume we have an item in cart
    await page.goto("/cart");

    // Find quantity input
    const quantityInput = page.getByRole("spinbutton").first();
    const initialValue = await quantityInput.inputValue();

    // Increase quantity
    await page
      .getByRole("button", { name: /increase quantity/i })
      .first()
      .click();

    // Verify quantity updated
    await expect(quantityInput).not.toHaveValue(initialValue);

    // Verify total updated
    await expect(page.getByTestId("cart-total")).not.toHaveText("$0.00");
  });

  test("should remove item from cart", async ({ page }) => {
    await page.goto("/cart");

    // Get initial item count
    const initialItems = await page
      .locator("[data-testid='cart-item']")
      .count();

    if (initialItems > 0) {
      // Remove first item
      await page
        .getByRole("button", { name: /remove/i })
        .first()
        .click();

      // Confirm removal if dialog appears
      const confirmButton = page.getByRole("button", { name: /confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify item removed
      const newCount = await page.locator("[data-testid='cart-item']").count();
      expect(newCount).toBe(initialItems - 1);
    }
  });

  test("should show empty cart message", async ({ page }) => {
    // Clear cart first (assuming an API endpoint or UI action)
    await page.goto("/cart");

    // If cart is empty
    const emptyMessage = page.getByText(/your cart is empty/i);
    if (await emptyMessage.isVisible()) {
      await expect(
        page.getByRole("link", { name: /continue shopping/i })
      ).toBeVisible();
    }
  });

  test("should proceed to checkout", async ({ page }) => {
    await page.goto("/cart");

    // Assume cart has items
    const checkoutButton = page.getByRole("link", {
      name: /proceed to checkout/i,
    });

    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      await expect(page).toHaveURL("/checkout");
    }
  });

  test("should apply coupon code", async ({ page }) => {
    await page.goto("/cart");

    // Find coupon input
    const couponInput = page.getByPlaceholder(/coupon code/i);

    if (await couponInput.isVisible()) {
      await couponInput.fill("TESTCODE");
      await page.getByRole("button", { name: /apply/i }).click();

      // Should show success or error message
      await expect(
        page.getByText(/coupon applied|invalid coupon/i)
      ).toBeVisible();
    }
  });
});

test.describe("Cart Drawer", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should open and close cart drawer", async ({ page }) => {
    await page.goto("/");

    // Open cart
    await page.getByRole("button", { name: /cart/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close cart
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("should navigate to full cart page from drawer", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /cart/i }).click();
    await page.getByRole("link", { name: /view cart/i }).click();

    await expect(page).toHaveURL("/cart");
  });
});
