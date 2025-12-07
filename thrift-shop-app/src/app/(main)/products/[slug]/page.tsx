/**
 * Product Detail Page
 * Displays single product with full details
 */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn, formatCurrency } from "@/lib/utils";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useToggleSavedItem } from "@/hooks/useUsers";
import { DetailPageSkeleton } from "@/components/shared/loading";
import { ProductReviews } from "@/components/products/product-reviews";
import { RelatedProducts } from "@/components/products/related-products";
import type { ProductCondition } from "@/types";

const conditionLabels: Record<ProductCondition, string> = {
  LIKE_NEW: "Like New",
  VERY_GOOD: "Very Good",
  GOOD: "Good Condition",
  FAIR: "Fair Condition",
  POOR: "Poor Condition",
};

const conditionDescriptions: Record<ProductCondition, string> = {
  LIKE_NEW: "Worn once or twice, no visible signs of wear",
  VERY_GOOD: "Minimal signs of use, excellent condition",
  GOOD: "Gently used with minor signs of wear",
  FAIR: "Shows visible wear but still functional",
  POOR: "Heavy wear, may have defects or damage",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError, error } = useProduct(slug);
  const addToCart = useAddToCart();
  const { data: cart } = useCart();
  const { toggle: toggleSaved, isSaved, isPending: isSaving } = useToggleSavedItem();
  
  const isWishlisted = product ? isSaved(product.id) : false;

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !product) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">
          {error?.message || "The product you're looking for doesn't exist."}
        </p>
        <Button className="mt-4" onClick={() => router.push("/shop")}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const images = product.media?.length
    ? product.media.map((m) => m.url)
    : ["/placeholder-product.jpg"];
  const isOutOfStock = product.quantity === 0;

  // Check if product is already in cart and how many
  const cartItem = cart?.items.find((item) => item.productId === product.id);
  const cartQuantity = cartItem?.quantity || 0;
  const availableQuantity = product.quantity - cartQuantity;
  const maxQuantity = Math.min(availableQuantity, product.quantity);

  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100
      )
    : 0;

  // Reset quantity when available quantity changes (e.g., when cart updates)
  useEffect(() => {
    if (product && cart) {
      if (quantity > maxQuantity) {
        setQuantity(Math.max(1, maxQuantity));
      }
    }
  }, [maxQuantity, product, cart, quantity]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    if (addToCart.isPending) {
      return; // Prevent double submission
    }

    // Check if we can add the requested quantity
    if (quantity > availableQuantity) {
      toast.error(
        `Only ${availableQuantity} available. You already have ${cartQuantity} in your cart.`
      );
      return;
    }

    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          toast.success("Added to cart");
        },
        onError: (err) => {
          // Error toast is already shown by the hook, but log for debugging
          console.error("Add to cart error:", err);
          // Show additional error details if available
          if (err instanceof Error) {
            console.error("Error details:", {
              message: err.message,
              statusCode: (err as any).statusCode,
            });
          }
        },
      }
    );
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      // Add to cart and wait for it to complete
      await addToCart.mutateAsync({ productId: product.id, quantity });

      // Wait a bit for cart state to update and cookie to be set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to checkout
      router.push("/checkout");
    } catch (err) {
      // Error toast is already shown by the hook, but log for debugging
      console.error("Buy now error:", err);
      // Don't redirect on error
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
          </BreadcrumbItem>
          {product.category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/shop?category=${product.category.id}`}>
                  {product.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Product Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image
              src={images[selectedImageIndex]}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <Badge variant="destructive" className="absolute left-4 top-4">
                -{discountPercent}%
              </Badge>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded bg-white px-4 py-2 text-lg font-medium">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setSelectedImageIndex((i) =>
                      i === 0 ? images.length - 1 : i - 1
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setSelectedImageIndex((i) =>
                      i === images.length - 1 ? 0 : i + 1
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2",
                    selectedImageIndex === index
                      ? "border-primary"
                      : "border-transparent"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{product.title}</h1>
              {product.vendor && (
                <Link
                  href={`/vendors/${product.vendor.id}`}
                  className="mt-1 inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Store className="h-4 w-4" />
                  {product.vendor.displayName}
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => product && toggleSaved(product.id)}
                disabled={isSaving || !product}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isWishlisted && "fill-red-500 text-red-500"
                  )}
                />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rating */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                  const avgRating =
                    product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                    product.reviews.length;
                  return (
                    <Star
                      key={star}
                      className={cn(
                        "h-5 w-5",
                        star <= Math.round(avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      )}
                    />
                  );
                })}
              </div>
              <span className="text-sm text-muted-foreground">
                {(
                  product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  product.reviews.length
                ).toFixed(1)}{" "}
                ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(product.comparePrice!)}
                </span>
                <Badge variant="destructive">Save {discountPercent}%</Badge>
              </>
            )}
          </div>

          <Separator className="my-6" />

          {/* Condition */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Condition</h3>
            <div className="rounded-lg border p-3">
              <p className="font-medium">
                {conditionLabels[product.condition]}
              </p>
              <p className="text-sm text-muted-foreground">
                {conditionDescriptions[product.condition]}
              </p>
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {availableQuantity > 0 ? (
                  <>
                    {availableQuantity} available
                    {cartQuantity > 0 && ` (${cartQuantity} in cart)`}
                  </>
                ) : (
                  "Out of stock"
                )}
              </span>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
                disabled={
                  isOutOfStock || availableQuantity <= 0 || addToCart.isPending
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addToCart.isPending
                  ? "Adding..."
                  : availableQuantity <= 0
                  ? `Max in Cart (${cartQuantity})`
                  : "Add to Cart"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBuyNow}
                disabled={
                  isOutOfStock || availableQuantity <= 0 || addToCart.isPending
                }
              >
                {addToCart.isPending ? "Adding..." : "Buy Now"}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center rounded-lg border p-3 text-center">
              <Truck className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Free Shipping
              </span>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-3 text-center">
              <Shield className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Buyer Protection
              </span>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-3 text-center">
              <RotateCcw className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Easy Returns
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({product.reviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p>{product.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Product Details</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Product ID</dt>
                  <dd>{product.id.slice(0, 8)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Condition</dt>
                  <dd>{conditionLabels[product.condition]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>{product.category?.name || "Uncategorized"}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Shipping</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping From</dt>
                  <dd>United States</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>3-7 business days</dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <ProductReviews productId={product.id} />
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
        <RelatedProducts
          categoryId={product.category?.id}
          currentProductId={product.id}
        />
      </div>
    </div>
  );
}
