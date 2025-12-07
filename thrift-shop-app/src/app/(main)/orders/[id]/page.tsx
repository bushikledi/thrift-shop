/**
 * Order Detail Page
 * View complete order details
 */
"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Printer,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useOrder } from "@/hooks/useOrders";
import { LoadingSkeleton } from "@/components/shared";
import type { OrderItemResponseDto } from "@/types";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800",
    icon: RotateCcw,
  },
};

const orderSteps = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-[200px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <LoadingSkeleton className="h-[300px]" />
          <LoadingSkeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Order not found</h2>
          <p className="mt-2 text-muted-foreground">
            This order doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/account/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusLower = order.status.toLowerCase() as OrderStatus;
  const statusInfo = statusConfig[statusLower] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  // Get current step index
  const currentStepIndex = orderSteps.findIndex(
    (step) => step.status === statusLower
  );
  const isCancelled =
    order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.orderNumber || order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Placed on{" "}
              {order.createdAt
                ? format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")
                : "-"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="mr-2 h-4 w-4" />
            Get Help
          </Button>
        </div>
      </div>

      {/* Order Progress */}
      {!isCancelled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Status</span>
              <Badge className={cn("gap-1", statusInfo.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted">
                <div
                  className="absolute h-full bg-primary transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      (currentStepIndex / (orderSteps.length - 1)) * 100
                    )}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {orderSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background z-10",
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs text-center",
                          isCurrent
                            ? "font-semibold text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Info */}
            {order.status === "SHIPPED" && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4" />
                  <span>
                    Order Number:{" "}
                    <span className="font-mono font-medium">
                      {order.orderNumber}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancelled/Refunded Banner */}
      {isCancelled && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">
                  Order{" "}
                  {order.status === "CANCELLED" ? "Cancelled" : "Refunded"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.status === "CANCELLED"
                    ? "This order has been cancelled."
                    : "This order has been refunded."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items ({order.items?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {order.items?.map((item: OrderItemResponseDto, index: number) => (
                <div
                  key={index}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name || "Product"}
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
                      href={`/products/${item.product?.slug || ""}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {item.product?.name || "Product"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price?.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status === "DELIVERED" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                  <Button variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Return Items
                  </Button>
                  <Button variant="outline">Buy Again</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping === 0
                    ? "Free"
                    : `$${order.shipping?.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.tax?.toFixed(2) || "0.00"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="text-sm">
                  <p className="font-medium">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.address}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="text-muted-foreground mt-1">
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No shipping address
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm capitalize">
                {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
              </p>
              {order.paymentStatus && (
                <Badge
                  variant={
                    order.paymentStatus === "PAID" ? "default" : "secondary"
                  }
                  className="mt-2"
                >
                  {order.paymentStatus}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
