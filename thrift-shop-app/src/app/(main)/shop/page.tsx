/**
 * Shop Page (Product List)
 * Displays all products with filtering and pagination
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import {
  CardGridSkeleton,
  EmptySearchResults,
  Pagination,
} from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Grid, List, X } from "lucide-react";
import type { ProductCondition } from "@/types";

const PAGE_SIZE = 12;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialCondition = searchParams.get("condition") as
    | ProductCondition
    | "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";

  // Local state
  const [page, setPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort as "newest" | "price_asc" | "price_desc" | "popular");
  const [condition, setCondition] = useState(initialCondition);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Helper to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      search?: string;
      categoryId?: string;
      categorySlug?: string;
      condition?: ProductCondition;
      minPrice?: number;
      maxPrice?: number;
      sort: "newest" | "price_asc" | "price_desc" | "popular";
    } = {
      page,
      limit: PAGE_SIZE,
      sort: sort as "newest" | "price_asc" | "price_desc" | "popular",
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryId) {
      // Use categoryId if it's a UUID, otherwise use categorySlug
      if (isUUID(categoryId)) {
        params.categoryId = categoryId;
      } else {
        params.categorySlug = categoryId;
      }
    }
    if (condition) params.condition = condition;
    if (minPrice) params.minPrice = parseFloat(minPrice);
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);

    return params;
  }, [
    page,
    debouncedSearch,
    categoryId,
    condition,
    minPrice,
    maxPrice,
    sort,
  ]);

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error,
  } = useProducts(queryParams);

  // Fetch categories for filter
  const { data: categoriesData } = useCategories();

  const products = productsData?.data || [];
  const totalItems = productsData?.meta?.total || 0;
  const totalPages = productsData?.meta?.totalPages || 1;
  const categories = categoriesData || [];

  // Find category by slug or ID for filter display
  const selectedCategoryForFilter = useMemo(() => {
    if (!categoryId) return "";
    // Check if it's a UUID (categoryId)
    if (isUUID(categoryId)) {
      return categoryId;
    }
    // Otherwise, it's a slug - find the category by slug
    const category = categories.find((cat) => cat.slug === categoryId);
    return category?.id || "";
  }, [categoryId, categories]);

  // Human-readable name for the active category chip. `categoryId` may be a
  // UUID or a slug, and may point at a subcategory, so search the whole tree
  // (top-level + children) by either key.
  const selectedCategoryName = useMemo(() => {
    if (!categoryId) return "";
    const matches = (c: { id: string; slug: string }) =>
      c.id === categoryId || c.slug === categoryId;
    const findDeep = (
      cats: Array<{
        id: string;
        slug: string;
        name: string;
        children?: Array<{ id: string; slug: string; name: string }>;
      }>
    ): { name: string } | undefined => {
      for (const c of cats) {
        if (matches(c)) return c;
        if (c.children?.length) {
          const found = findDeep(c.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findDeep(categories)?.name ?? "";
  }, [categoryId, categories]);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      router.push(`/shop?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Handle filter changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    updateURL({ q: value, page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
    updateURL({ category: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSort(value as "newest" | "price_asc" | "price_desc" | "popular");
    updateURL({ sort: value });
  };

  const handleConditionChange = (value: ProductCondition | "") => {
    setCondition(value);
    setPage(1);
    updateURL({ condition: value, page: 1 });
  };

  const handlePriceChange = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPage(1);
    updateURL({ minPrice: min, maxPrice: max, page: 1 });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryId("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
    router.push("/shop");
  };

  const hasActiveFilters =
    searchQuery || categoryId || condition || minPrice || maxPrice;

  // Filter component props
  const filterProps = {
    categories,
    categoryId: selectedCategoryForFilter,
    onCategoryChange: (value: string) => {
      // When category is changed from filter, use the category ID
      // But we need to find if there's a slug for this category
      const category = categories.find((cat) => cat.id === value);
      const categoryValue = category?.slug || category?.id || value;
      handleCategoryChange(categoryValue);
    },
    condition,
    onConditionChange: handleConditionChange,
    minPrice,
    maxPrice,
    onPriceChange: handlePriceChange,
    onClearFilters: clearFilters,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Shop</h1>
        <p className="mt-2 text-muted-foreground">
          Discover unique pre-loved items at great prices
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort and View Options */}
        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-80 overflow-y-auto"
            >
              <div className="py-4">
                <h2 className="mb-4 text-lg font-semibold">Filters</h2>
                <ProductFilters {...filterProps} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSearchChange("")}
            >
              Search: {searchQuery}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
          {categoryId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCategoryChange("")}
            >
              {selectedCategoryName || "Category"}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
          {condition && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleConditionChange("")}
            >
              {condition}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
          {(minPrice || maxPrice) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePriceChange("", "")}
            >
              ${minPrice || "0"} - ${maxPrice || "∞"}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          {/* Scroll the filter panel independently of the product grid so long
              filter lists are reachable without scrolling the whole page. */}
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <h2 className="mb-4 text-lg font-semibold">Filters</h2>
            <ProductFilters {...filterProps} />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {productsLoading ? (
            <CardGridSkeleton count={PAGE_SIZE} />
          ) : productsError ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              Failed to load products: {error?.message || "Unknown error"}
            </div>
          ) : products.length === 0 ? (
            <EmptySearchResults
              query={searchQuery}
              onClear={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              {/* Results info */}
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} products
                </div>
              </div>

              {/* Products grid */}
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                    : "space-y-4"
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
