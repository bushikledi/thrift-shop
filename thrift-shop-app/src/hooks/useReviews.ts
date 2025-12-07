/**
 * Reviews Hooks
 * React Query hooks for reviews operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewsApi } from "@/lib/api/reviews";
import { queryKeys } from "./queryKeys";
import type {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  ReviewsListParams,
  PaginationParams,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Get all reviews with filters
 */
export function useReviews(params?: ReviewsListParams) {
  return useQuery({
    queryKey: queryKeys.reviews.list(params as Record<string, unknown>),
    queryFn: () => reviewsApi.list(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get review by ID
 */
export function useReview(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(id),
    queryFn: () => reviewsApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get reviews for a product
 */
export function useProductReviews(productId: string, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.reviews.product(
      productId,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => reviewsApi.getProductReviews(productId, params),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get reviews for a vendor
 */
export function useVendorReviews(vendorId: string, params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.reviews.vendor(
      vendorId,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => reviewsApi.getVendorReviews(vendorId, params),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get current user reviews
 */
export function useMyReviews(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.reviews.me(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => reviewsApi.getMyReviews(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewDto) => reviewsApi.create(data),
    onSuccess: (review: ReviewResponseDto) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });

      if (review.productId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(review.productId),
        });
      }
      if (review.vendorId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vendors.all,
        });
      }

      toast.success("Review submitted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to submit review");
    },
  });
}

/**
 * Update a review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewDto }) =>
      reviewsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.reviews.detail(id),
      });

      const previousReview = queryClient.getQueryData<ReviewResponseDto>(
        queryKeys.reviews.detail(id)
      );

      if (previousReview) {
        queryClient.setQueryData<ReviewResponseDto>(
          queryKeys.reviews.detail(id),
          { ...previousReview, ...data }
        );
      }

      return { previousReview };
    },
    onError: (error: ApiError, { id }, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(
          queryKeys.reviews.detail(id),
          context.previousReview
        );
      }
      toast.error(error.message || "Failed to update review");
    },
    onSuccess: (review: ReviewResponseDto) => {
      queryClient.setQueryData(queryKeys.reviews.detail(review.id), review);
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.lists() });
      toast.success("Review updated successfully");
    },
  });
}

/**
 * Delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      toast.success("Review deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
}

/**
 * Helper to render star rating
 */
export function renderStars(rating: number, size: "sm" | "md" | "lg" = "md") {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return Array.from({ length: 5 }).map((_, i) => ({
    filled: i < rating,
    className: sizeClasses[size],
  }));
}
