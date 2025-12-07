"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { useUIStore } from "@/lib/stores";
import { formatPrice } from "@/lib/utils";
import type { ProductListItemDto, CategoryResponseDto } from "@/types";
import Image from "next/image";
import Link from "next/link";

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

const resultItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.15 },
  }),
};

export function SearchModal() {
  const t = useTranslations();
  const router = useRouter();
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  // Initialize recent searches from localStorage synchronously to avoid effect warning
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens and trap focus
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
      
      // Trap focus within modal
      const modal = document.querySelector('.fixed.top-0.left-0.right-0.z-50') as HTMLElement;
      if (modal) {
        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        };
        
        modal.addEventListener('keydown', handleTab);
        
        return () => {
          document.body.style.overflow = "unset";
          modal.removeEventListener('keydown', handleTab);
        };
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    if (isSearchOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen, closeSearch]);

  // Search products
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => productsApi.list({ search: query, limit: 5 }),
    enabled: query.length >= 2,
  });

  // Get categories for suggestions
  const { data: categories } = useQuery({
    queryKey: ["categories", "search"],
    queryFn: () => categoriesApi.list(),
    enabled: isSearchOpen && query.length === 0,
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    // Save to recent searches
    const newRecent = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));

    closeSearch();
    router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const products = searchResults?.data || [];
  const totalProducts = searchResults?.meta?.total || 0;
  const showResults = query.length >= 2;
  const showSuggestions = query.length === 0;

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeSearch}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 p-4 md:p-8 flex justify-center"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-full max-w-2xl bg-background rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <form onSubmit={handleSubmit} className="border-b">
                <div className="flex items-center gap-3 p-4">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={t("common.searchPlaceholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 text-lg p-0 h-auto"
                  />
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={closeSearch}
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Loading State */}
                {isLoading && query.length >= 2 && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Search Results */}
                {showResults && !isLoading && (
                  <div className="p-4">
                    {products.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-3">
                          Products ({totalProducts})
                        </p>
                        <div className="space-y-2">
                          {products.map(
                            (product: ProductListItemDto, index: number) => (
                              <motion.div
                                key={product.id}
                                custom={index}
                                variants={resultItemVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <Link
                                  href={`/products/${product.slug}`}
                                  onClick={closeSearch}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                                    <Image
                                      src={
                                        product.media?.[0]?.url ||
                                        "/placeholder-product.jpg"
                                      }
                                      alt={product.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {product.title}
                                    </p>
                                    <p className="text-primary text-sm font-semibold">
                                      {formatPrice(Number(product.price))}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              </motion.div>
                            )
                          )}
                        </div>
                        {totalProducts > 5 && (
                          <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => handleSearch(query)}
                          >
                            View all {totalProducts} results
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No results found for &quot;{query}&quot;
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Try different keywords or browse categories
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions when no query */}
                {showSuggestions && (
                  <div className="p-4 space-y-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Recent Searches
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground"
                            onClick={clearRecentSearches}
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <motion.button
                              key={search}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleSearch(search)}
                              className="px-3 py-1.5 text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                            >
                              {search}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Categories */}
                    {categories && categories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4" />
                          Popular Categories
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {categories
                            .filter((cat: CategoryResponseDto) => !cat.parentId)
                            .slice(0, 6)
                            .map(
                              (
                                category: CategoryResponseDto,
                                index: number
                              ) => (
                                <motion.div
                                  key={category.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Link
                                    href={`/shop?category=${category.slug}`}
                                    onClick={closeSearch}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                      <span className="text-lg">
                                        {getCategoryEmoji(category.slug)}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {category.name}
                                    </span>
                                  </Link>
                                </motion.div>
                              )
                            )}
                        </div>
                      </div>
                    )}

                    {/* Trending Searches */}
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4" />
                        Trending Now
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Vintage",
                          "Denim",
                          "Designer",
                          "Sneakers",
                          "Accessories",
                        ].map((term, index) => (
                          <motion.button
                            key={term}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            onClick={() => handleSearch(term)}
                            className="px-3 py-1.5 text-sm border rounded-full hover:border-primary hover:text-primary transition-colors"
                          >
                            {term}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getCategoryEmoji(slug: string): string {
  const emojis: Record<string, string> = {
    clothing: "👕",
    shoes: "👟",
    accessories: "👜",
    electronics: "📱",
    home: "🏠",
    books: "📚",
    sports: "⚽",
    beauty: "💄",
    jewelry: "💍",
    vintage: "🎭",
  };
  return emojis[slug] || "📦";
}
