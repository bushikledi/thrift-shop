/**
 * Cart Page
 * Displays shopping cart with item management
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/hooks/useCart";
import {
  LoadingSkeleton,
  EmptyCart,
  ConfirmationModal,
  CartPageSkeleton,
} from "@/components/shared";
import type { CartItemDto } from "@/types";

export default function CartPage() {
  const { data: cart, isLoading, isError, error } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveCartItem();
  const clearCart = useClearCart();

  const [promoCode, setPromoCode] = useState("");
  const [clearCartOpen, setClearCartOpen] = useState(false);

  const cartItems = cart?.items || [];
  // Handle both string and number subtotal from API
  const subtotal =
    typeof cart?.subtotal === "string"
      ? parseFloat(cart.subtotal)
      : cart?.subtotal || 0;
  const shipping = 0; // Shipping calculated at checkout
  const tax = 0; // Tax calculated at checkout
  const total = subtotal; // Total calculated at checkout

  const handleQuantityChange = (item: CartItemDto, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      handleRemoveItem(item.id);
      return;
    }
    // Handle both string and number quantity from API
    const maxQuantity =
      typeof item.product.quantity === "string"
        ? parseInt(item.product.quantity, 10)
        : item.product.quantity;

    if (newQuantity > maxQuantity) {
      toast.error(`Only ${maxQuantity} available`);
      return;
    }

    updateCartItem.mutate(
      { itemId: item.id, data: { quantity: newQuantity } },
      {
        onError: (err) => {
          toast.error(err.message || "Failed to update quantity");
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart.mutate(itemId, {
      onSuccess: () => {
        toast.success("Item removed from cart");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to remove item");
      },
    });
  };

  const handleClearCart = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        toast.success("Cart cleared");
        setClearCartOpen(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to clear cart");
      },
    });
  };

  const handleApplyPromo = () => {
    if (!promoCode) {
      toast.error("Please enter a promo code");
      return;
    }
    // TODO: Implement promo code API
    toast.error("Invalid promo code");
  };

  if (isLoading) {
    return <CartPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Error loading cart</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load cart"}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyCart />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-4">
            But we saw you have items! There might be a sync issue.
          </p>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Shopping Cart</h1>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setClearCartOpen(true)}
          aria-label="Clear all items from cart"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Clear Cart</span>
          <span className="sm:hidden">Clear</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
              isUpdating={updateCartItem.isPending}
              isRemoving={removeFromCart.isPending}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Promo Code */}
              <div className="flex gap-2">
                <Input
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  aria-label="Enter promo code"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={handleApplyPromo}
                  aria-label="Apply promo code"
                >
                  Apply
                </Button>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/shop">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Clear Cart Confirmation */}
      <ConfirmationModal
        open={clearCartOpen}
        onOpenChange={setClearCartOpen}
        title="Clear cart?"
        description="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmLabel="Clear Cart"
        variant="destructive"
        onConfirm={handleClearCart}
        isLoading={clearCart.isPending}
      />
    </div>
  );
}

interface CartItemCardProps {
  item: CartItemDto;
  onQuantityChange: (item: CartItemDto, delta: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  isUpdating,
  isRemoving,
}: CartItemCardProps) {
  const product = item.product;
  const productImage = product.media?.[0]?.url || "/placeholder-product.jpg";
  // Handle both string and number prices from API
  const productPrice =
    typeof product.price === "string"
      ? parseFloat(product.price)
      : product.price;
  const itemTotal = productPrice * item.quantity;

  // Use slug if available, otherwise fall back to product ID
  const productLink = product.slug
    ? `/products/${product.slug}`
    : `/products/${product.id}`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <Link
            href={productLink}
            className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-md bg-muted"
            aria-label={`View ${product.title}`}
          >
            <Image
              src={productImage}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, 96px"
              loading="lazy"
              quality={85}
            />
          </Link>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div className="flex justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={productLink}
                  className="font-medium hover:text-primary line-clamp-2"
                  aria-label={`View ${product.title}`}
                >
                  {product.title}
                </Link>
                {product.vendor && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Sold by {product.vendor.displayName}
                  </p>
                )}
              </div>
              <p className="font-semibold shrink-0">
                {formatCurrency(itemTotal)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => onQuantityChange(item, -1)}
                    disabled={isUpdating}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="w-8 text-center text-sm font-medium"
                    aria-label={`Quantity: ${item.quantity}`}
                  >
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => onQuantityChange(item, 1)}
                    disabled={
                      isUpdating ||
                      item.quantity >=
                        (typeof product.quantity === "string"
                          ? parseInt(product.quantity, 10)
                          : product.quantity)
                    }
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(productPrice)} each
                </span>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => onRemove(item.id)}
                disabled={isRemoving}
                aria-label={`Remove ${product.title} from cart`}
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="sr-only">Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Remove</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
