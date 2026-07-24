"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, useUIStore } from "@/lib/stores";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useClearCart,
} from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    x: "100%",
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
    },
  },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
    },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export function CartDrawer() {
  const t = useTranslations();
  const router = useRouter();
  const { isCartOpen, closeCart } = useUIStore();
  // Display comes from the store (kept in sync from the server by useCart), but
  // all mutations must go through the server-backed React Query mutations —
  // previously the drawer only mutated the local store, so removes/qty changes
  // never persisted and reappeared on refresh.
  const { items, totalPrice } = useCartStore();
  const { data: serverCart } = useCart();
  const removeCartItem = useRemoveCartItem();
  const updateCartItem = useUpdateCartItem();
  const clearCartMutation = useClearCart();
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Map productId -> server cart item id (the id the mutations require).
  const itemIdByProduct = new Map(
    (serverCart?.items ?? []).map((i) => [i.productId, i.id])
  );

  const persistRemove = (productId: string) => {
    const itemId = itemIdByProduct.get(productId);
    if (!itemId) return;
    setRemovingItemId(productId);
    removeCartItem.mutate(itemId, {
      onSettled: () => setRemovingItemId(null),
    });
  };

  const persistUpdateQuantity = (productId: string, quantity: number) => {
    const itemId = itemIdByProduct.get(productId);
    if (!itemId) return;
    setUpdatingItemId(productId);
    updateCartItem.mutate(
      { itemId, data: { quantity } },
      { onSettled: () => setUpdatingItemId(null) }
    );
  };

  const persistClearCart = () => clearCartMutation.mutate();

  // Close drawer on escape key and trap focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isCartOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      
      // Trap focus within drawer
      const drawer = document.querySelector('[role="dialog"]') as HTMLElement;
      if (drawer) {
        const focusableElements = drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        };
        
        drawer.addEventListener('keydown', handleTab);
        firstElement?.focus();
        
        return () => {
          document.removeEventListener("keydown", handleEscape);
          document.body.style.overflow = "unset";
          drawer.removeEventListener('keydown', handleTab);
        };
      }
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleViewCart = () => {
    closeCart();
    router.push("/cart");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 id="cart-drawer-title" className="text-lg font-semibold">
                  {t("cart.title")}
                </h2>
                <motion.span
                  className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={items.length}
                  aria-label={`${items.length} items in cart`}
                >
                  {items.length}
                </motion.span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCart}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full p-8 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("cart.empty")}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start shopping to add items to your cart
                  </p>
                  <Button
                    onClick={() => {
                      closeCart();
                      router.push("/shop");
                    }}
                  >
                    Continue Shopping
                  </Button>
                </motion.div>
              ) : (
                <div className="p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.productId}
                        custom={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                          <Image
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.productId}`}
                            onClick={closeCart}
                            className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-primary font-semibold text-sm mt-1">
                            {formatPrice(item.price)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                persistUpdateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              disabled={updatingItemId === item.productId || item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              {updatingItemId === item.productId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </Button>
                            <motion.span
                              className="w-8 text-center text-sm font-medium"
                              key={item.quantity}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                            >
                              {item.quantity}
                            </motion.span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                persistUpdateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              disabled={updatingItemId === item.productId}
                              aria-label="Increase quantity"
                            >
                              {updatingItemId === item.productId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => persistRemove(item.productId)}
                              disabled={removingItemId === item.productId}
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              {removingItemId === item.productId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear Cart */}
                  {items.length > 0 && (
                    <motion.div layout>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={persistClearCart}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Cart
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                className="border-t p-4 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {t("cart.subtotal")}
                  </span>
                  <motion.span
                    className="text-lg font-semibold"
                    key={totalPrice()}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    {formatPrice(totalPrice())}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping calculated at checkout
                </p>
                <div className="grid gap-2">
                  <Button onClick={handleCheckout} size="lg" className="w-full">
                    {t("cart.checkout")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewCart}
                    className="w-full"
                  >
                    View Full Cart
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
