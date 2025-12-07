/**
 * Product Card Component
 * Displays a product in grid or list format
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Eye, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useToggleSavedItem } from "@/hooks/useUsers";
import type {
  ProductDetailDto,
  ProductListItemDto,
  ProductCondition,
} from "@/types";

interface ProductCardProps {
  product: ProductDetailDto | ProductListItemDto;
  variant?: "grid" | "list";
  showVendor?: boolean;
}

const conditionColors: Record<ProductCondition, string> = {
  LIKE_NEW: "bg-green-100 text-green-800",
  VERY_GOOD: "bg-blue-100 text-blue-800",
  GOOD: "bg-yellow-100 text-yellow-800",
  FAIR: "bg-orange-100 text-orange-800",
  POOR: "bg-red-100 text-red-800",
};

const conditionLabels: Record<ProductCondition, string> = {
  LIKE_NEW: "Like New",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export function ProductCard({
  product,
  variant = "grid",
  showVendor = true,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const addToCart = useAddToCart();
  const { data: cart } = useCart();
  const { toggle: toggleSaved, isSaved, isPending: isSaving } = useToggleSavedItem();
  
  const isWishlisted = isSaved(product.id);

  // Check if product is already in cart and how many
  const cartItem = cart?.items.find((item) => item.productId === product.id);
  const cartQuantity = cartItem?.quantity || 0;
  const availableQuantity = product.quantity - cartQuantity;
  const isOutOfStock = product.quantity === 0;
  const isMaxInCart = availableQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we can add more
    if (isMaxInCart) {
      toast.error(
        `Only ${product.quantity} available. You already have ${cartQuantity} in your cart.`,
        {
          duration: 4000,
        }
      );
      return;
    }

    if (isOutOfStock) {
      toast.error("This product is out of stock", {
        duration: 3000,
      });
      return;
    }

    addToCart.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          toast.success("Added to cart", {
            duration: 2000,
            description: product.title,
          });
        },
        onError: (error) => {
          // Show user-friendly error message
          const errorMessage = error.message || "Failed to add to cart";
          toast.error(errorMessage, {
            duration: 4000,
          });
        },
      }
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(product.id);
  };

  const productImage = product.media?.[0]?.url || "/placeholder-product.jpg";
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100
      )
    : 0;

  if (variant === "list") {
    return (
      <Card className="overflow-hidden">
        <Link href={`/products/${product.slug}`} className="flex">
          {/* Image */}
          <div className="relative w-48 shrink-0">
            {!imageError ? (
              <Image
                src={productImage}
                alt={product.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            {(isOutOfStock || isMaxInCart) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded bg-white px-2 py-1 text-sm font-medium">
                  {isOutOfStock ? "Out of Stock" : "Max in Cart"}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold hover:text-primary line-clamp-1">
                    {product.title}
                  </h3>
                  {showVendor && product.vendor && (
                    <p className="text-sm text-muted-foreground">
                      by {product.vendor.displayName}
                    </p>
                  )}
                </div>
                <Badge
                  className={cn(
                    "shrink-0",
                    conditionColors[product.condition as ProductCondition]
                  )}
                >
                  {conditionLabels[product.condition as ProductCondition]}
                </Badge>
              </div>

              {"description" in product && product.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.comparePrice!)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlist}
                  disabled={isSaving}
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
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isMaxInCart || addToCart.isPending}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {addToCart.isPending
                    ? "Adding..."
                    : isMaxInCart
                    ? `Max in Cart (${cartQuantity})`
                    : "Add to Cart"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
      <Link 
        href={`/products/${product.slug}`}
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        aria-label={`View ${product.title}`}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={productImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
              quality={85}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/50">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <Badge
              className={cn(
                conditionColors[product.condition as ProductCondition]
              )}
            >
              {conditionLabels[product.condition as ProductCondition]}
            </Badge>
            {hasDiscount && (
              <Badge variant="destructive">-{discountPercent}%</Badge>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded bg-white px-3 py-1.5 text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick actions */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
              onClick={handleWishlist}
              disabled={isSaving}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  isWishlisted && "fill-red-500 text-red-500"
                )}
              />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
              aria-label={`Quick view ${product.title}`}
              title={`Quick view ${product.title}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1 group-hover:text-primary">
            {product.title}
          </h3>
          {showVendor && product.vendor && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {product.vendor.displayName}
            </p>
          )}

          {/* Rating */}
          {"reviews" in product &&
            product.reviews &&
            product.reviews.length > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">
                  {product.reviews.length} reviews
                </span>
              </div>
            )}
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.comparePrice!)}
              </span>
            )}
          </div>
        </CardFooter>
      </Link>

      {/* Add to cart button */}
      <div className="px-4 pb-4">
        <Button
          className="w-full transition-all"
          size="sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isMaxInCart || addToCart.isPending}
          aria-label={
            isOutOfStock
              ? `${product.title} is out of stock`
              : isMaxInCart
              ? `Maximum quantity (${cartQuantity}) already in cart`
              : `Add ${product.title} to cart`
          }
        >
          {addToCart.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : isMaxInCart ? (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Max in Cart ({cartQuantity})
            </>
          ) : isOutOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;
