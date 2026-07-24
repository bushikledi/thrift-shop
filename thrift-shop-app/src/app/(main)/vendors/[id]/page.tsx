/**
 * Vendor Detail Page
 * Individual vendor store page
 */
"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Star,
  Package,
  Share2,
  Heart,
  Grid,
  List,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { useVendor, useVendorProducts } from "@/hooks/useVendors";
import { useVendorReviews } from "@/hooks/useReviews";
import { useAddToCart } from "@/hooks/useCart";
import { Pagination, LoadingSkeleton, EmptyState } from "@/components/shared";
import type { ProductListItemDto } from "@/types";

const PAGE_SIZE = 12;

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

function StarRating({
  rating,
  showCount,
  count,
}: {
  rating: number;
  showCount?: boolean;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
          )}
        />
      ))}
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground ml-1">({count})</span>
      )}
    </div>
  );
}

interface VendorPageProps {
  params: Promise<{ id: string }>;
}

export default function VendorPage({ params }: VendorPageProps) {
  const { id } = use(params);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("products");

  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const { data: productsData, isLoading: productsLoading } = useVendorProducts(
    id,
    { page, limit: PAGE_SIZE }
  );
  // Reviews are keyed by the vendor's UUID, while the route param is the slug —
  // use the id from the loaded vendor (the hook is gated on a truthy id).
  const { data: reviewsData, isLoading: reviewsLoading } = useVendorReviews(
    vendor?.id ?? "",
    { page: 1, limit: 10 }
  );

  const addToCartMutation = useAddToCart();

  const products = productsData?.data ?? [];
  const totalPages = productsData?.meta?.totalPages ?? 1;
  const reviews = reviewsData?.data || [];

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCartMutation.mutateAsync({ productId, quantity: 1 });
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vendor?.displayName,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (vendorLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <LoadingSkeleton className="h-[200px]" />
        <LoadingSkeleton className="h-[100px]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={Store}
          title="Vendor not found"
          description="This vendor doesn't exist or is no longer available."
          action={{
            label: "Browse Vendors",
            href: "/vendors",
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Vendor Info */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={vendor.logo} />
              <AvatarFallback className="text-4xl">
                {vendor.displayName?.[0] || "V"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{vendor.displayName}</h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-foreground">
                        {vendor.rating ? Number(vendor.rating).toFixed(1) : "N/A"}
                      </span>
                      <span>({vendor.reviewCount || 0} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Heart className="mr-2 h-4 w-4" />
                    Follow
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {vendor.bio && (
            <p className="mt-4 text-muted-foreground max-w-3xl">{vendor.bio}</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({vendor.reviewCount || 0})
            </TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            {/* Filters */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                {products.length} products
              </p>
              <div className="flex items-center gap-4">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[160px]">
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

            {/* Products */}
            {productsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-[300px]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products yet"
                description="This vendor hasn't listed any products yet."
              />
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product: ProductListItemDto) => (
                    <Card key={product.id} className="overflow-hidden group">
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
                      <CardContent className="p-4">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-medium line-clamp-1 hover:underline"
                        >
                          {product.title}
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-semibold">
                            {formatCurrency(product.price)}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {product.condition?.replace("_", " ")}
                          </Badge>
                        </div>
                        <Button
                          className="w-full mt-3"
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product: ProductListItemDto) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Link href={`/products/${product.slug}`}>
                            <div className="relative h-24 w-24 rounded-lg bg-muted overflow-hidden">
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
                              className="font-medium hover:underline"
                            >
                              {product.title}
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="font-semibold">
                                {formatCurrency(product.price)}
                              </p>
                              <Badge variant="outline" className="capitalize">
                                {product.condition?.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(product.id)}
                            disabled={addToCartMutation.isPending}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            {reviewsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-[150px]" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Be the first to review this vendor."
              />
            ) : (
              <div className="space-y-6">
                {/* Rating Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-5xl font-bold">
                          {vendor.rating ? Number(vendor.rating).toFixed(1) : "0"}
                        </p>
                        <StarRating rating={vendor.rating || 0} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {vendor.reviewCount || 0} reviews
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-24" />
                      <div className="flex-1">
                        {/* Rating distribution would go here */}
                        <p className="text-sm text-muted-foreground">
                          Rating distribution coming soon
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Reviews */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.user?.avatar} />
                            <AvatarFallback>
                              {review.user?.name?.[0] ||
                                review.user?.email?.[0] ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {review.user?.name ||
                                    review.user?.email ||
                                    "Anonymous"}
                                </p>
                                <StarRating rating={review.rating} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {review.createdAt
                                  ? format(
                                      new Date(review.createdAt),
                                      "MMM d, yyyy"
                                    )
                                  : "-"}
                              </p>
                            </div>
                            {review.title && (
                              <p className="font-semibold mt-2">
                                {review.title}
                              </p>
                            )}
                            <p className="text-muted-foreground mt-1">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    About {vendor.displayName}
                  </h3>
                  <p className="text-muted-foreground">
                    {vendor.bio || "No description available."}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2"></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
