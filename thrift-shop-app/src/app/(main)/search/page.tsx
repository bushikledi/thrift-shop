/**
 * Search Results Page
 * Display search results with filters
 */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Grid, List, X, Package, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";
import { useCategories } from "@/hooks/useCategories";
import { useAddToCart } from "@/hooks/useCart";
import { Pagination, LoadingSkeleton, EmptyState } from "@/components/shared";
import { toast } from "sonner";
import type { ProductListItemDto } from "@/types";

const PAGE_SIZE = 20;

const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "relevance";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchQuery, setSearchQuery] = useState(query);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [conditions, setConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const { data, isLoading } = useSearch({
    q: query,
    page,
    limit: PAGE_SIZE,
  });

  const addToCartMutation = useAddToCart();

  const results = data?.products?.data || [];
  const totalPages = Math.ceil((data?.products?.total || 0) / PAGE_SIZE);
  const totalItems = data?.products?.total || 0;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (sort !== "relevance") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());

    const url = `/search?${params.toString()}`;
    router.replace(url, { scroll: false });
  }, [query, category, sort, page, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCartMutation.mutateAsync({ productId, quantity: 1 });
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setConditions([...conditions, condition]);
    } else {
      setConditions(conditions.filter((c) => c !== condition));
    }
  };

  const clearFilters = () => {
    setCategory("");
    setConditions([]);
    setPriceRange([0, 1000]);
    setSort("relevance");
  };

  const hasActiveFilters =
    category ||
    conditions.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000;

  // Filter sidebar content - rendered inline to avoid component creation during render
  const filtersContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "block w-full text-left text-sm",
              !category
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "block w-full text-left text-sm",
                category === cat.id
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="font-semibold mb-3">Condition</h3>
        <div className="space-y-2">
          {conditionOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`condition-${option.value}`}
                checked={conditions.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleConditionChange(option.value, checked as boolean)
                }
              />
              <Label
                htmlFor={`condition-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={1000}
          step={10}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}+</span>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 text-lg"
            />
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          {query && (
            <h1 className="text-2xl font-bold">
              Results for &ldquo;{query}&rdquo;
            </h1>
          )}
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? "result" : "results"} found
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Mobile Filter Button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filtersContent}</div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={sort} onValueChange={setSort}>
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

          {/* View Mode */}
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === category)?.name}
              <button onClick={() => setCategory("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {conditions.map((condition) => (
            <Badge key={condition} variant="secondary" className="gap-1">
              {conditionOptions.find((c) => c.value === condition)?.label}
              <button onClick={() => handleConditionChange(condition, false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < 1000) && (
            <Badge variant="secondary" className="gap-1">
              ${priceRange[0]} - ${priceRange[1]}
              <button onClick={() => setPriceRange([0, 1000])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          {filtersContent}
        </aside>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <LoadingSkeleton
                  key={i}
                  className={viewMode === "grid" ? "h-[350px]" : "h-[150px]"}
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description={
                query
                  ? `We couldn't find any products matching "${query}". Try different keywords or remove some filters.`
                  : "Try searching for something!"
              }
              action={
                hasActiveFilters
                  ? {
                      label: "Clear Filters",
                      onClick: clearFilters,
                    }
                  : undefined
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((product: ProductListItemDto) => (
                  <div
                    key={product.id}
                    className="group rounded-lg border bg-card overflow-hidden"
                  >
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative aspect-square bg-muted">
                        {product.media?.[0]?.url ? (
                          <Image
                            src={product.media[0].url}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium line-clamp-1 hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.vendor?.displayName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-semibold">
                          ${product.price?.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {product.condition?.replace("_", " ")}
                        </Badge>
                      </div>
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addToCartMutation.isPending}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((product: ProductListItemDto) => (
                  <div
                    key={product.id}
                    className="flex gap-4 rounded-lg border bg-card p-4"
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex-shrink-0"
                    >
                      <div className="relative h-32 w-32 rounded-lg bg-muted overflow-hidden">
                        {product.media?.[0]?.url ? (
                          <Image
                            src={product.media[0].url}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {product.vendor?.displayName}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="font-semibold text-lg">
                          ${product.price?.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {product.condition?.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <Button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addToCartMutation.isPending}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mb-8">
            <LoadingSkeleton className="h-12" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-[350px]" />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
