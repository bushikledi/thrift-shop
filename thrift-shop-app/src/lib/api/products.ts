/**
 * Products API Service
 */
import { get, post, put, del } from "../apiClient";
import type {
  ProductListItemDto,
  ProductDetailDto,
  CreateProductDto,
  UpdateProductDto,
  PaginatedProductsResponseDto,
  ProductsListParams,
} from "@/types";

export const productsApi = {
  /**
   * Get all products with filters
   */
  list: (params?: ProductsListParams): Promise<PaginatedProductsResponseDto> =>
    get<PaginatedProductsResponseDto>("/products", { params }),

  /**
   * Get product by slug
   */
  getBySlug: (slug: string): Promise<ProductDetailDto> =>
    get<ProductDetailDto>(`/products/${slug}`),

  /**
   * Get featured products
   */
  getFeatured: (limit: number = 8): Promise<ProductListItemDto[]> =>
    get<ProductListItemDto[]>("/products/featured", { params: { limit } }),

  /**
   * Get related products
   */
  getRelated: (id: string, limit: number = 4): Promise<ProductListItemDto[]> =>
    get<ProductListItemDto[]>(`/products/${id}/related`, { params: { limit } }),

  /**
   * Create a new product (vendor only)
   */
  create: (data: CreateProductDto): Promise<ProductDetailDto> =>
    post<ProductDetailDto, CreateProductDto>("/products", data),

  /**
   * Update a product (vendor only)
   */
  update: (id: string, data: UpdateProductDto): Promise<ProductDetailDto> =>
    put<ProductDetailDto, UpdateProductDto>(`/products/${id}`, data),

  /**
   * Delete a product (vendor only)
   */
  delete: (id: string): Promise<void> => del<void>(`/products/${id}`),
};

export default productsApi;
