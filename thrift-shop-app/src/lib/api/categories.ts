/**
 * Categories API Service
 */
import { get, post, put, del } from "../apiClient";
import type {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/types";

export const categoriesApi = {
  /**
   * Get all categories (tree structure)
   */
  list: (includeInactive: boolean = false): Promise<CategoryResponseDto[]> =>
    get<CategoryResponseDto[]>("/categories", { params: { includeInactive } }),

  /**
   * Get category by slug
   */
  getBySlug: (slug: string): Promise<CategoryResponseDto> =>
    get<CategoryResponseDto>(`/categories/${slug}`),

  /**
   * Create a new category (admin only)
   */
  create: (data: CreateCategoryDto): Promise<CategoryResponseDto> =>
    post<CategoryResponseDto, CreateCategoryDto>("/categories", data),

  /**
   * Update a category (admin only)
   */
  update: (id: string, data: UpdateCategoryDto): Promise<CategoryResponseDto> =>
    put<CategoryResponseDto, UpdateCategoryDto>(`/categories/${id}`, data),

  /**
   * Delete a category (admin only)
   */
  delete: (id: string): Promise<void> => del<void>(`/categories/${id}`),
};

export default categoriesApi;
