/**
 * Search API Service
 */
import { get } from "../apiClient";
import type {
  SearchResponseDto,
  TrendingResponseDto,
  SearchParams,
} from "@/types";

export const searchApi = {
  /**
   * Search across products, vendors, and categories
   */
  search: (params: SearchParams): Promise<SearchResponseDto> =>
    get<SearchResponseDto>("/search", { params }),

  /**
   * Get search suggestions
   */
  suggestions: (q: string, limit: number = 10): Promise<string[]> =>
    get<string[]>("/search/suggestions", { params: { q, limit } }),

  /**
   * Get trending products, categories, and searches
   */
  trending: (limit: number = 10): Promise<TrendingResponseDto> =>
    get<TrendingResponseDto>("/search/trending", { params: { limit } }),
};

export default searchApi;
