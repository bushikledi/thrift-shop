/**
 * Users Hooks
 * React Query hooks for user operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "./queryKeys";
import type {
  UpdateUserDto,
  UserProfileResponseDto,
  SavedItemResponseDto,
  PaginationParams,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Get current user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: () => usersApi.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update current user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.updateProfile(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.profile() });

      const previousProfile = queryClient.getQueryData<UserProfileResponseDto>(
        queryKeys.users.profile()
      );

      if (previousProfile) {
        queryClient.setQueryData<UserProfileResponseDto>(
          queryKeys.users.profile(),
          { ...previousProfile, ...data }
        );
      }

      return { previousProfile };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.users.profile(),
          context.previousProfile
        );
      }
      toast.error(error.message || "Failed to update profile");
    },
    onSuccess: (profile: UserProfileResponseDto) => {
      queryClient.setQueryData(queryKeys.users.profile(), profile);
      // Also update auth user
      queryClient.setQueryData(queryKeys.auth.me(), { user: profile });
      toast.success("Profile updated successfully");
    },
  });
}

/**
 * Get saved/wishlist items
 */
export function useSavedItems() {
  return useQuery({
    queryKey: queryKeys.users.savedItems(),
    queryFn: () => usersApi.getSavedItems(),
    staleTime: 60 * 1000,
  });
}

/**
 * Save an item to wishlist
 */
export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => usersApi.saveItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.savedItems(),
      });

      const previousItems = queryClient.getQueryData<SavedItemResponseDto[]>(
        queryKeys.users.savedItems()
      );

      // Optimistic add (minimal item)
      if (previousItems) {
        queryClient.setQueryData<SavedItemResponseDto[]>(
          queryKeys.users.savedItems(),
          [
            ...previousItems,
            {
              id: `temp-${productId}`,
              productId,
              userId: "",
              createdAt: new Date().toISOString(),
            } as SavedItemResponseDto,
          ]
        );
      }

      return { previousItems };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          queryKeys.users.savedItems(),
          context.previousItems
        );
      }
      toast.error(error.message || "Failed to save item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.savedItems() });
      toast.success("Item saved to wishlist");
    },
  });
}

/**
 * Remove item from wishlist
 */
export function useRemoveSavedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => usersApi.removeSavedItem(productId),
    onMutate: async (productId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.savedItems(),
      });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<SavedItemResponseDto[]>(
        queryKeys.users.savedItems()
      );

      // Optimistically update the cache
      if (previousItems) {
        const updatedItems = previousItems.filter(
          (item) => item.productId !== productId
        );
        queryClient.setQueryData<SavedItemResponseDto[]>(
          queryKeys.users.savedItems(),
          updatedItems
        );
      }

      // Return context with the previous value for rollback
      return { previousItems, productId };
    },
    onError: (error: ApiError, productId, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          queryKeys.users.savedItems(),
          context.previousItems
        );
      }
      toast.error(error.message || "Failed to remove item");
    },
    onSuccess: (_, productId) => {
      // Optimistic update already applied, no need to invalidate immediately
      // This keeps the UI instant. The cache will be fresh on next mount/refetch
      toast.success("Item removed from wishlist");
    },
  });
}

/**
 * Toggle item saved status
 */
export function useToggleSavedItem() {
  const { data: savedItems } = useSavedItems();
  const saveItem = useSaveItem();
  const removeSavedItem = useRemoveSavedItem();

  const isSaved = (productId: string) =>
    savedItems?.some((item) => item.productId === productId) ?? false;

  const toggle = (productId: string) => {
    if (isSaved(productId)) {
      removeSavedItem.mutate(productId);
    } else {
      saveItem.mutate(productId);
    }
  };

  return {
    toggle,
    isSaved,
    isPending: saveItem.isPending || removeSavedItem.isPending,
  };
}

/**
 * Get user orders
 */
export function useUserOrders(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.orders(params),
    queryFn: () => usersApi.getOrders(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Get current user address
 */
export function useUserAddress() {
  return useQuery({
    queryKey: queryKeys.users.address(),
    queryFn: () => usersApi.getAddress(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update current user address
 */
export function useUpdateUserAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }) => usersApi.updateAddress(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.address() });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.profile() });

      const previousAddress = queryClient.getQueryData(
        queryKeys.users.address()
      );
      const previousProfile = queryClient.getQueryData<UserProfileResponseDto>(
        queryKeys.users.profile()
      );

      // Optimistically update address
      queryClient.setQueryData(queryKeys.users.address(), data);
      if (previousProfile) {
        queryClient.setQueryData<UserProfileResponseDto>(
          queryKeys.users.profile(),
          {
            ...previousProfile,
            address: data as unknown as Record<string, never>,
          }
        );
      }

      return { previousAddress, previousProfile };
    },
    onError: (error: ApiError, _, context) => {
      if (context?.previousAddress) {
        queryClient.setQueryData(
          queryKeys.users.address(),
          context.previousAddress
        );
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.users.profile(),
          context.previousProfile
        );
      }
      toast.error(error.message || "Failed to update address");
    },
    onSuccess: (address) => {
      queryClient.setQueryData(queryKeys.users.address(), address);
      // Also update profile cache
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
      toast.success("Address updated successfully");
    },
  });
}
