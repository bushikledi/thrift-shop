/**
 * Loading Components
 * Reusable loading states for the application
 */
"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

/**
 * Animated loading spinner
 */
export function LoadingSpinner({
  size = "md",
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder for loading content
 */
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/**
 * Card skeleton for product/item cards
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <LoadingSkeleton className="aspect-square w-full rounded-md" />
      <div className="mt-4 space-y-2">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton className="h-6 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Grid of card skeletons
 */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <LoadingSkeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <LoadingSkeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      ))}
      <LoadingSkeleton className="mt-4 h-10 w-32" />
    </div>
  );
}

/**
 * Profile skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-6">
      <LoadingSkeleton className="h-24 w-24 rounded-full" />
      <div className="flex-1 space-y-3">
        <LoadingSkeleton className="h-6 w-48" />
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

/**
 * Detail page skeleton
 */
export function DetailPageSkeleton() {
  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <LoadingSkeleton className="aspect-square w-full rounded-lg" />

        {/* Details */}
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-3/4" />
          <LoadingSkeleton className="h-6 w-1/4" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3" />
          </div>
          <LoadingSkeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Page loading overlay
 */
export function PageLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator
 */
export function InlineLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({
  className,
  text = "Loading...",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </span>
  );
}

/**
 * Cart item skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex gap-4">
        <LoadingSkeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-md shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-8 w-24" />
            <LoadingSkeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart page skeleton
 */
export function CartPageSkeleton() {
  return (
    <div className="container py-8">
      <LoadingSkeleton className="h-8 w-48 mb-8" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
        <div>
          <LoadingSkeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
