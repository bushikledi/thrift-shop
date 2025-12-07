/**
 * New Product Page
 * Create a new product listing
 */
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/vendor/product-form";

export default function NewProductPage() {
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
        <h1 className="mt-4 text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new listing for your store
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
