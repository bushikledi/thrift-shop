/**
 * Search Hooks
 * React Query hooks for search operations
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/search";
import { queryKeys } from "./queryKeys";
import type { SearchParams } from "@/types";

/**
 * Search across products, vendors, and categories
 */
export function useSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.results(params as Record<string, unknown>),
    queryFn: () => searchApi.search(params),
    enabled: !!params.q && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get search suggestions (autocomplete)
 */
export function useSearchSuggestions(q: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.suggestions(q),
    queryFn: () => searchApi.suggestions(q, limit),
    enabled: q.length >= 2, // Only search with 2+ characters
    staleTime: 60 * 1000,
  });
}

/**
 * Get trending products, categories, and searches
 */
export function useTrending(limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.trending(limit),
    queryFn: () => searchApi.trending(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Debounced search hook
 */
export function useDebouncedSearch(
  query: string,
  types?: string,
  debounceMs = 300
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useSearch({ q: debouncedQuery, types }, debouncedQuery.length >= 2);
}

// Import useState and useEffect for the debounced hook
import { useState, useEffect } from "react";
