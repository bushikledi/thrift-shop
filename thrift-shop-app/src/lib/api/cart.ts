/**
 * Cart API Service
 */
import { get, post, put, del } from "../apiClient";
import type { CartResponseDto, AddToCartDto, UpdateCartItemDto } from "@/types";

export const cartApi = {
  /**
   * Get current cart
   */
  get: (): Promise<CartResponseDto> => get<CartResponseDto>("/cart"),

  /**
   * Add item to cart
   * Note: Backend may return CartItem, but we'll refetch the full cart
   */
  addItem: (data: AddToCartDto): Promise<unknown> =>
    post<unknown, AddToCartDto>("/cart/items", data),

  /**
   * Update cart item quantity
   */
  updateItem: (
    itemId: string,
    data: UpdateCartItemDto
  ): Promise<CartResponseDto> =>
    put<CartResponseDto, UpdateCartItemDto>(`/cart/items/${itemId}`, data),

  /**
   * Remove item from cart
   */
  removeItem: (itemId: string): Promise<CartResponseDto> =>
    del<CartResponseDto>(`/cart/items/${itemId}`),

  /**
   * Clear cart
   */
  clear: (): Promise<void> => del<void>("/cart"),
};

export default cartApi;
