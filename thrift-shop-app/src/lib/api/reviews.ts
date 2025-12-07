/**
 * Reviews API Service
 */
import { get, post, put, del } from "../apiClient";
import type {
  ReviewResponseDto,
  ReviewListResponseDto,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewsListParams,
  PaginationParams,
} from "@/types";

export const reviewsApi = {
  /**
   * Get all reviews with filters
   */
  list: (params?: ReviewsListParams): Promise<ReviewListResponseDto> =>
    get<ReviewListResponseDto>("/reviews", { params }),

  /**
   * Get review by ID
   */
  getById: (id: string): Promise<ReviewResponseDto> =>
    get<ReviewResponseDto>(`/reviews/${id}`),

  /**
   * Get reviews for a product
   */
  getProductReviews: (
    productId: string,
    params: PaginationParams
  ): Promise<ReviewListResponseDto> =>
    get<ReviewListResponseDto>(`/reviews/product/${productId}`, { params }),

  /**
   * Get reviews for a vendor
   */
  getVendorReviews: (
    vendorId: string,
    params: PaginationParams
  ): Promise<ReviewListResponseDto> =>
    get<ReviewListResponseDto>(`/reviews/vendor/${vendorId}`, { params }),

  /**
   * Get current user reviews
   */
  getMyReviews: (params: PaginationParams): Promise<ReviewListResponseDto> =>
    get<ReviewListResponseDto>("/reviews/me", { params }),

  /**
   * Create a new review
   */
  create: (data: CreateReviewDto): Promise<ReviewResponseDto> =>
    post<ReviewResponseDto, CreateReviewDto>("/reviews", data),

  /**
   * Update a review
   */
  update: (id: string, data: UpdateReviewDto): Promise<ReviewResponseDto> =>
    put<ReviewResponseDto, UpdateReviewDto>(`/reviews/${id}`, data),

  /**
   * Delete a review
   */
  delete: (id: string): Promise<void> => del<void>(`/reviews/${id}`),
};

export default reviewsApi;
