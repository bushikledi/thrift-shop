/**
 * Cart Hooks
 * React Query hooks for cart operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { cartApi } from "@/lib/api/cart";
import { queryKeys } from "./queryKeys";
import type { CartResponseDto, AddToCartDto, UpdateCartItemDto } from "@/types";
import { ApiError } from "@/lib/apiClient";
import { useCartStore } from "@/lib/stores/cart-store";

/**
 * Get current cart
 * Also syncs with Zustand cart store for header/cart drawer
 */
export function useCart() {
  const { setCartFromApi } = useCartStore();

  const query = useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: async () => {
      try {
        return await cartApi.get();
      } catch (error) {
        // If cart doesn't exist (404), return null instead of throwing
        // The backend should create a cart on first add, but handle gracefully
        if (error instanceof ApiError && error.statusCode === 404) {
          return null;
        }
        // Log other errors for debugging
        console.error("Cart fetch error:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 - cart might not exist yet (guest users)
      if (error instanceof ApiError && error.statusCode === 404) {
        return false;
      }
      // Don't retry on 401 - might be auth issue, but cart should work for guests
      if (error instanceof ApiError && error.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Sync Zustand store with API cart data
  useEffect(() => {
    if (query.data) {
      setCartFromApi(query.data);
    } else if (query.data === null) {
      // Cart is empty or doesn't exist
      setCartFromApi(null);
    }
  }, [query.data, setCartFromApi]);

  return query;
}

/**
 * Add item to cart with optimistic updates
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToCartDto) => cartApi.addItem(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

      const previousCart = queryClient.getQueryData<CartResponseDto | null>(
        queryKeys.cart.current()
      );

      // Optimistic update - but validate quantity first
      // If cart doesn't exist, we'll create a minimal optimistic cart
      if (previousCart) {
        const existingItem = previousCart.items.find(
          (item) => item.productId === data.productId
        );

        if (existingItem) {
          // Check if the new quantity would exceed available stock
          const newQuantity = existingItem.quantity + (data.quantity || 1);
          const productQuantity = existingItem.product?.quantity;

          // Only do optimistic update if we can validate it won't exceed stock
          if (productQuantity !== undefined && newQuantity <= productQuantity) {
            queryClient.setQueryData<CartResponseDto>(
              queryKeys.cart.current(),
              {
                ...previousCart,
                items: previousCart.items.map((item) =>
                  item.productId === data.productId
                    ? { ...item, quantity: newQuantity }
                    : item
                ),
                itemCount: previousCart.itemCount + (data.quantity || 1),
              }
            );
          }
          // If we can't validate or it would exceed, skip optimistic update
          // The server will validate and return an error if needed
        } else {
          // For new items, check if we have product info to validate
          // If not, skip optimistic update to avoid showing invalid state
          // The server will validate and add the item if valid
        }
      }
      // If no cart exists, don't do optimistic update - let the server create it

      return { previousCart };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          queryKeys.cart.current(),
          context.previousCart
        );
      }
      toast.error(error.message || "Failed to add item to cart");
    },
    onSuccess: async () => {
      // Backend returns CartItem, but we need the full cart
      // Wait a bit for cookie to be set, then refetch the full cart
      setTimeout(async () => {
        try {
          // Invalidate to trigger refetch
          queryClient.invalidateQueries({
            queryKey: queryKeys.cart.current(),
          });

          // Explicitly refetch to get updated cart with all items
          const updatedCart =
            await queryClient.fetchQuery<CartResponseDto | null>({
              queryKey: queryKeys.cart.current(),
              queryFn: async () => {
                try {
                  return await cartApi.get();
                } catch (error) {
                  if (error instanceof ApiError && error.statusCode === 404) {
                    return null;
                  }
                  throw error;
                }
              },
              retry: false,
            });

          if (updatedCart) {
            queryClient.setQueryData(queryKeys.cart.current(), updatedCart);
          }
        } catch (error) {
          console.error("Failed to refetch cart:", error);
          // Invalidate anyway to trigger refetch on next access
          queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
        }
      }, 200); // 200ms delay to ensure cookie is set
      // Note: Toast is shown by the component to avoid duplicates
    },
  });
}

/**
 * Update cart item quantity with optimistic updates
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateCartItemDto;
    }) => cartApi.updateItem(itemId, data),
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

      const previousCart = queryClient.getQueryData<CartResponseDto>(
        queryKeys.cart.current()
      );

      if (previousCart) {
        const oldItem = previousCart.items.find((item) => item.id === itemId);
        const quantityDiff = oldItem
          ? data.quantity - oldItem.quantity
          : data.quantity;

        queryClient.setQueryData<CartResponseDto>(queryKeys.cart.current(), {
          ...previousCart,
          items: previousCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity: data.quantity } : item
          ),
          itemCount: previousCart.itemCount + quantityDiff,
        });
      }

      return { previousCart };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          queryKeys.cart.current(),
          context.previousCart
        );
      }
      toast.error(error.message || "Failed to update cart");
    },
    onSuccess: (cart: CartResponseDto) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
    },
  });
}

/**
 * Remove item from cart with optimistic updates
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

      const previousCart = queryClient.getQueryData<CartResponseDto>(
        queryKeys.cart.current()
      );

      if (previousCart) {
        const removedItem = previousCart.items.find(
          (item) => item.id === itemId
        );
        queryClient.setQueryData<CartResponseDto>(queryKeys.cart.current(), {
          ...previousCart,
          items: previousCart.items.filter((item) => item.id !== itemId),
          itemCount: previousCart.itemCount - (removedItem?.quantity ?? 0),
        });
      }

      return { previousCart };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          queryKeys.cart.current(),
          context.previousCart
        );
      }
      toast.error(error.message || "Failed to remove item");
    },
    onSuccess: (cart: CartResponseDto) => {
      queryClient.setQueryData(queryKeys.cart.current(), cart);
      toast.success("Item removed from cart");
    },
  });
}

/**
 * Clear cart
 */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clear(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

      const previousCart = queryClient.getQueryData<CartResponseDto>(
        queryKeys.cart.current()
      );

      // Optimistic clear
      queryClient.setQueryData<CartResponseDto | null>(
        queryKeys.cart.current(),
        null
      );

      return { previousCart };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          queryKeys.cart.current(),
          context.previousCart
        );
      }
      toast.error(error.message || "Failed to clear cart");
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.cart.current(), null);
      toast.success("Cart cleared");
    },
  });
}

/**
 * Helper hook to get cart item count
 */
export function useCartItemCount(): number {
  const { data: cart } = useCart();
  return cart?.itemCount ?? 0;
}

/**
 * Helper hook to get cart subtotal
 */
export function useCartSubtotal(): number {
  const { data: cart } = useCart();
  return cart?.subtotal ?? 0;
}

/**
 * Helper hook to check if a product is in cart
 */
export function useIsInCart(productId: string): boolean {
  const { data: cart } = useCart();
  return cart?.items.some((item) => item.productId === productId) ?? false;
}
