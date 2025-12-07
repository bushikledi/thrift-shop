/**
 * Empty State Component
 * Displays when no data is available
 */
"use client";

import { cn } from "@/lib/utils";
import {
  LucideIcon,
  PackageOpen,
  Search,
  FileQuestion,
  ShoppingCart,
  Heart,
  Bell,
  Users,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    container: "py-8",
    icon: "h-8 w-8",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    container: "py-12",
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-16 w-16",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className={cn("text-muted-foreground", sizes.icon)} />
      </div>
      <h3 className={cn("font-semibold", sizes.title)}>{title}</h3>
      {description && (
        <p
          className={cn(
            "mt-1 max-w-md text-muted-foreground",
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases

export function EmptySearchResults({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search or filters.`
          : "No items match your current filters. Try adjusting your search criteria."
      }
      action={
        onClear ? { label: "Clear filters", onClick: onClear } : undefined
      }
    />
  );
}

export function EmptyProducts() {
  return (
    <EmptyState
      icon={PackageOpen}
      title="No products yet"
      description="There are no products available at the moment. Check back later!"
    />
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Your cart is empty"
      description="Looks like you haven't added any items to your cart yet."
      action={{ label: "Start shopping", href: "/shop" }}
    />
  );
}

export function EmptyWishlist() {
  return (
    <EmptyState
      icon={Heart}
      title="Your wishlist is empty"
      description="Save items you love by clicking the heart icon on any product."
      action={{ label: "Browse products", href: "/shop" }}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No orders yet"
      description="When you place your first order, it will appear here."
      action={{ label: "Start shopping", href: "/shop" }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
      size="sm"
    />
  );
}

export function EmptyVendorProducts() {
  return (
    <EmptyState
      icon={Store}
      title="No products listed"
      description="Start adding products to your store to reach customers."
      action={{ label: "Add your first product", href: "/vendor/products/new" }}
    />
  );
}

export function EmptyVendorOrders() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No orders received"
      description="When customers order your products, they'll appear here."
    />
  );
}

export function EmptyReviews() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No reviews yet"
      description="Be the first to review this product and help other shoppers."
      size="sm"
    />
  );
}

export function EmptyUsers() {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="No users match your current search criteria."
    />
  );
}

export default EmptyState;
