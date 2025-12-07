/**
 * Wishlist Hooks
 * React Query hooks for wishlist/saved items operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { get, post, del } from "@/lib/apiClient";
import { queryKeys } from "./queryKeys";
import type { ProductListItemDto } from "@/types";

// Types
interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductListItemDto & {
    vendor?: {
      id: string;
      businessName: string;
    };
  };
}

interface Wishlist {
  items: WishlistItem[];
  total: number;
}

// API functions
const wishlistApi = {
  getWishlist: (): Promise<Wishlist> => get<Wishlist>("/wishlist"),

  addToWishlist: (productId: string): Promise<WishlistItem> =>
    post<WishlistItem>("/wishlist", { productId }),

  removeFromWishlist: (productId: string): Promise<void> =>
    del<void>(`/wishlist/${productId}`),

  isInWishlist: (productId: string): Promise<{ isInWishlist: boolean }> =>
    get<{ isInWishlist: boolean }>(`/wishlist/check/${productId}`),
};

/**
 * Get user's wishlist
 */
export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: () => wishlistApi.getWishlist(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if product is in wishlist
 */
export function useIsInWishlist(productId: string) {
  return useQuery({
    queryKey: queryKeys.wishlist.check(productId),
    queryFn: () => wishlistApi.isInWishlist(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Add product to wishlist
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => wishlistApi.addToWishlist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
      queryClient.setQueryData(queryKeys.wishlist.check(productId), {
        isInWishlist: true,
      });
      toast.success("Added to saved items");
    },
    onError: () => {
      toast.error("Failed to add to saved items");
    },
  });
}

/**
 * Remove product from wishlist
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      wishlistApi.removeFromWishlist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
      queryClient.setQueryData(queryKeys.wishlist.check(productId), {
        isInWishlist: false,
      });
    },
    onError: () => {
      toast.error("Failed to remove from saved items");
    },
  });
}

/**
 * Toggle wishlist status
 */
export function useToggleWishlist() {
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  return {
    toggle: (productId: string, isInWishlist: boolean) => {
      if (isInWishlist) {
        return removeMutation.mutateAsync(productId);
      }
      return addMutation.mutateAsync(productId);
    },
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
