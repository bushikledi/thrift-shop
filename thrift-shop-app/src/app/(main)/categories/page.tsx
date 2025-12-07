/**
 * Categories Page
 * Browse all product categories
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { Tag, FolderTree, Package } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared";
import type { CategoryResponseDto } from "@/types";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Categories</h1>
          <p className="text-muted-foreground">
            Browse products by category
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const categoryList = categories || [];
  const topLevelCategories = categoryList.filter((cat) => !cat.parentId);
  const subCategories = categoryList.filter((cat) => cat.parentId);

  // Group subcategories by parent
  const categoriesByParent = subCategories.reduce(
    (acc, cat) => {
      const parentId = cat.parentId || "none";
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(cat);
      return acc;
    },
    {} as Record<string, CategoryResponseDto[]>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p className="text-muted-foreground">
          Browse products by category
        </p>
      </div>

      {topLevelCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-center">
              Categories will appear here once they are added
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Top Level Categories */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FolderTree className="h-6 w-6" />
              Main Categories
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topLevelCategories.map((category) => {
                const subCats = categoriesByParent[category.id] || [];
                const productCount = (category as CategoryResponseDto & {
                  _count?: { products?: number };
                })._count?.products || 0;

                return (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.slug || category.id}`}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {category.image ? (
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Tag className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {category.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {subCats.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <FolderTree className="h-3 w-3" />
                                  {subCats.length} subcategories
                                </span>
                              )}
                              {productCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {productCount} products
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Subcategories grouped by parent */}
          {Object.entries(categoriesByParent).map(([parentId, subCats]) => {
            const parent = categoryList.find((c) => c.id === parentId);
            if (!parent || subCats.length === 0) return null;

            return (
              <div key={parentId}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <span>{parent.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({subCats.length} subcategories)
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {subCats.map((category) => {
                    const productCount = (category as CategoryResponseDto & {
                      _count?: { products?: number };
                    })._count?.products || 0;

                    return (
                      <Link
                        key={category.id}
                        href={`/shop?category=${category.slug || category.id}`}
                        className="group"
                      >
                        <Card className="h-full transition-all hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center">
                              {category.image ? (
                                <div className="relative h-20 w-20 mb-3 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-20 w-20 mb-3 items-center justify-center rounded-lg bg-muted">
                                  <Tag className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                              {productCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {productCount} products
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

