/**
 * New Product Page
 * Create a new product listing. With `?from=<slug>` the form is pre-filled from
 * an existing product (the Duplicate action).
 */
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/vendor/product-form";
import { useProduct } from "@/hooks/useProducts";
import { LoadingSkeleton } from "@/components/shared";
import type { ProductDetailDto } from "@/types";

function NewProductContent() {
  const searchParams = useSearchParams();
  const duplicateFrom = searchParams.get("from");
  const { data: source, isLoading } = useProduct(
    duplicateFrom || "",
    Boolean(duplicateFrom)
  );

  // When duplicating, seed the form with the source product's fields (minus its
  // identity) and mark the title as a copy.
  const initial: ProductDetailDto | undefined =
    duplicateFrom && source
      ? ({
          ...source,
          id: undefined as unknown as string,
          slug: undefined as unknown as string,
          title: `${source.title} (Copy)`,
          media: [],
        } as ProductDetailDto)
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/vendor/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Products
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {duplicateFrom ? "Duplicate Product" : "Add New Product"}
        </h1>
        <p className="text-muted-foreground">
          {duplicateFrom
            ? "Review the pre-filled details and save as a new listing"
            : "Create a new listing for your store"}
        </p>
      </div>

      {duplicateFrom && isLoading ? (
        <LoadingSkeleton className="h-[400px]" />
      ) : (
        <ProductForm mode="create" product={initial} />
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
      <NewProductContent />
    </Suspense>
  );
}
