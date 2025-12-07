/**
 * Saved Items Page
 * User's wishlist/saved products
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Grid,
  List,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSavedItems, useRemoveSavedItem } from "@/hooks/useUsers";
import { useAddToCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import {
  LoadingSkeleton,
  EmptyState,
  DeleteConfirmation,
} from "@/components/shared";

export default function AccountSavedPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteItem, setDeleteItem] = useState<string | null>(null);

  const { data: savedItems, isLoading } = useSavedItems();
  const removeSavedItemMutation = useRemoveSavedItem();
  const addToCartMutation = useAddToCart();

  const items = savedItems || [];

  const handleRemove = async (productId: string) => {
    try {
      await removeSavedItemMutation.mutateAsync(productId);
      // Toast is handled by the mutation hook
      setDeleteItem(null);
    } catch {
      // Error toast is handled by the mutation hook
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCartMutation.mutateAsync({ productId, quantity: 1 });
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleMoveAllToCart = async () => {
    try {
      for (const item of items) {
        await addToCartMutation.mutateAsync({
          productId: item.product.id,
          quantity: 1,
        });
      }
      toast.success("All items added to cart");
    } catch {
      toast.error("Failed to add items to cart");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Saved Items</h1>
            <p className="text-muted-foreground">Your wishlist</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saved Items</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveAllToCart}
                disabled={addToCartMutation.isPending}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add All to Cart
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </>
          )}
          <div className="flex border rounded-md">
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

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved items"
          description="Items you save will appear here. Start browsing to find something you love!"
          action={{
            label: "Start Shopping",
            href: "/shop",
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                {item.product.media?.[0]?.url ? (
                  <Image
                    src={item.product.media[0].url}
                    alt={item.product.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {!item.product.isActive && (
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    Out of Stock
                  </Badge>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-medium line-clamp-1 hover:underline"
                >
                  {item.product.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.product.vendor?.displayName}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-semibold">
                    {formatCurrency(item.product.price)}
                  </p>
                  {item.product.comparePrice &&
                    item.product.comparePrice > item.product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(item.product.comparePrice)}
                      </p>
                    )}
                </div>
                <Button
                  className="w-full mt-3"
                  size="sm"
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={
                    !item.product.isActive || addToCartMutation.isPending
                  }
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.media?.[0]?.url ? (
                      <Image
                        src={item.product.media[0].url}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.product.vendor?.displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-semibold">
                        {formatCurrency(item.product.price)}
                      </p>
                      {item.product.comparePrice &&
                        item.product.comparePrice > item.product.price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(item.product.comparePrice)}
                          </p>
                        )}
                    </div>
                    {!item.product.isActive && (
                      <Badge variant="secondary" className="mt-2">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item.product.id)}
                      disabled={
                        !item.product.isActive || addToCartMutation.isPending
                      }
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteItem(item.product.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        itemName="this item"
        onConfirm={() => {
          if (deleteItem) {
            handleRemove(deleteItem);
          }
        }}
        isLoading={removeSavedItemMutation.isPending}
      />
    </div>
  );
}
