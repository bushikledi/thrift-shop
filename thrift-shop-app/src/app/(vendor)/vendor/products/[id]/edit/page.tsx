/**
 * Edit Product Page
 * Loads an existing listing and renders the product form in edit mode.
 * The `[id]` route segment carries the product slug.
 */
"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/vendor/product-form";
import { useProduct } from "@/hooks/useProducts";
import { LoadingSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id: slug } = use(params);
  const { data: product, isLoading } = useProduct(slug);

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
        <h1 className="mt-4 text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update your listing details</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-[400px]" />
      ) : product ? (
        <ProductForm mode="edit" product={product} />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Button asChild className="mt-4">
            <Link href="/vendor/products">Back to Products</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
