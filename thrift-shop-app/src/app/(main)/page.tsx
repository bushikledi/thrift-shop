/**
 * Home Page
 * Landing page with hero, featured products, and value propositions
 */
"use client";

import Link from "next/link";
import { HeroSection, ValuePropositions } from "@/components/home";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/products/product-card";
import { CardGridSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);

  return (
    <div className="flex flex-col">
      <HeroSection />
      <ValuePropositions />

      {/* Featured Products Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Discover unique finds from our trusted sellers
              </p>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <CardGridSkeleton count={8} />
          ) : (featuredProducts?.length ?? 0) > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {featuredProducts?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    // Add priority loading for first 4 images
                    // This is handled via Next.js Image component's priority prop
                  />
                ))}
              </div>
              <div className="text-center sm:hidden">
                <Link href="/shop">
                  <Button variant="outline" className="w-full group">
                    View All Products
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No featured products available yet
              </p>
              <Link href="/shop">
                <Button className="group">
                  Browse All Products
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Clothing", href: "/shop?category=clothing" },
              { name: "Accessories", href: "/shop?category=accessories" },
              { name: "Home & Living", href: "/shop?category=home" },
              { name: "Electronics", href: "/shop?category=electronics" },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden rounded-lg border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={`Browse ${category.name} category`}
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
