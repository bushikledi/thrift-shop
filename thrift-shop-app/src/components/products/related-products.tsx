/**
 * Related Products Component
 * Displays products from the same category
 */
"use client";

import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/products/product-card";
import { CardGridSkeleton } from "@/components/shared/loading";

interface RelatedProductsProps {
  categoryId?: string;
  currentProductId: string;
  limit?: number;
}

export function RelatedProducts({
  categoryId,
  currentProductId,
  limit = 4,
}: RelatedProductsProps) {
  const { data, isLoading } = useProducts({
    categoryId,
    limit: limit + 1, // Fetch one extra in case current product is included
  });

  if (isLoading) {
    return <CardGridSkeleton count={limit} />;
  }

  const products = data?.data
    ?.filter((p) => p.id !== currentProductId)
    .slice(0, limit);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default RelatedProducts;
