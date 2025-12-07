/**
 * useCart React Query Hook Tests
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientWrapper, testData } from "../test-utils";
import {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "@/hooks/useCart";
import { cartService } from "@/services/cart.service";

// Mock the cart service
jest.mock("@/services/cart.service", () => ({
  cartService: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
  },
}));

const mockCartService = cartService as jest.Mocked<typeof cartService>;

describe("useCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useCart hook", () => {
    it("fetches cart data successfully", async () => {
      const mockCart = {
        id: "cart-1",
        userId: "user-1",
        items: [testData.cartItem()],
        total: 29.99,
        itemCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCartService.getCart.mockResolvedValue(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCart);
      expect(mockCartService.getCart).toHaveBeenCalledTimes(1);
    });

    it("handles error state", async () => {
      mockCartService.getCart.mockRejectedValue(
        new Error("Failed to fetch cart")
      );

      const { result } = renderHook(() => useCart(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useAddToCart hook", () => {
    it("adds item to cart successfully", async () => {
      const mockProduct = testData.product();
      const mockCartItem = testData.cartItem({ productId: mockProduct.id });

      mockCartService.addToCart.mockResolvedValue({
        id: "cart-1",
        userId: "user-1",
        items: [mockCartItem],
        total: mockProduct.price,
        itemCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useAddToCart(), {
        wrapper: QueryClientWrapper,
      });

      result.current.mutate({ productId: mockProduct.id, quantity: 1 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCartService.addToCart).toHaveBeenCalledWith({
        productId: mockProduct.id,
        quantity: 1,
      });
    });

    it("handles duplicate item error", async () => {
      mockCartService.addToCart.mockRejectedValue(
        new Error("Item already in cart")
      );

      const { result } = renderHook(() => useAddToCart(), {
        wrapper: QueryClientWrapper,
      });

      result.current.mutate({ productId: "product-1", quantity: 1 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUpdateCartItem hook", () => {
    it("updates item quantity", async () => {
      const mockCartItem = testData.cartItem({ quantity: 3 });

      mockCartService.updateCartItem.mockResolvedValue({
        id: "cart-1",
        userId: "user-1",
        items: [mockCartItem],
        total: mockCartItem.price * 3,
        itemCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useUpdateCartItem(), {
        wrapper: QueryClientWrapper,
      });

      result.current.mutate({ itemId: mockCartItem.id, quantity: 3 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCartService.updateCartItem).toHaveBeenCalledWith(
        mockCartItem.id,
        { quantity: 3 }
      );
    });
  });

  describe("useRemoveFromCart hook", () => {
    it("removes item from cart", async () => {
      mockCartService.removeFromCart.mockResolvedValue({
        id: "cart-1",
        userId: "user-1",
        items: [],
        total: 0,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useRemoveFromCart(), {
        wrapper: QueryClientWrapper,
      });

      result.current.mutate("item-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCartService.removeFromCart).toHaveBeenCalledWith("item-1");
    });
  });
});
