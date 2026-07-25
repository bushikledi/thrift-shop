/**
 * Vendor Order Detail
 * View a single order and update its fulfilment status.
 */
"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CreditCard, MapPin, Package, Truck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/shared";
import { OrderStatusSelect } from "@/components/vendor/order-status-select";
import { useMyVendorOrder } from "@/hooks/useVendors";
import { orderStatusMeta } from "@/lib/order-status";
import { formatCurrency, formatDate } from "@/lib/utils";

// The generated OrderResponseDto omits a few relations the API actually
// returns (buyer, guestInfo, items with product). Describe just what we read.
interface VendorOrderView {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  subtotal?: number | string;
  shippingAmount?: number | string;
  discount?: number | string;
  total: number | string;
  createdAt?: string;
  customerNotes?: string | null;
  guestInfo?: { name?: string; email?: string; phone?: string } | null;
  buyer?: { name?: string; email?: string; phone?: string } | null;
  shippingAddress?: Record<string, string>;
  items?: Array<{
    id: string;
    title?: string | null;
    quantity: number;
    price: number | string;
    conditionSnapshot?: string | null;
    product?: {
      slug?: string;
      title?: string;
      media?: Array<{ url: string }>;
    } | null;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: orderRaw, isLoading } = useMyVendorOrder(id);
  const order = orderRaw as unknown as VendorOrderView | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-[200px]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Order not found</h2>
        <Button asChild className="mt-4">
          <Link href="/vendor/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const customer = order.buyer ?? order.guestInfo ?? null;
  const address = order.shippingAddress;
  const meta = orderStatusMeta(order.status);
  const StatusIcon = meta.icon;
  const discount = Number(order.discount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.createdAt ? formatDate(order.createdAt) : ""}
          </p>
        </div>
        <Badge className={`ml-auto ${meta.className}`}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {meta.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item) => {
                // `title` is the snapshot taken at checkout; the live product
                // may since have been renamed or archived.
                const title = item.title || item.product?.title || "Product";
                const image = item.product?.media?.[0]?.url;
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {image && (
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.product?.slug ? (
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="font-medium hover:text-primary"
                        >
                          {title}
                        </Link>
                      ) : (
                        <p className="font-medium">{title}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                        {item.conditionSnapshot
                          ? ` · ${item.conditionSnapshot.replace(/_/g, " ").toLowerCase()}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.quantity * Number(item.price))}
                    </p>
                  </div>
                );
              })}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingAmount ?? 0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {order.customerNotes}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Update status */}
          <Card>
            <CardHeader>
              <CardTitle>Fulfilment</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusSelect orderId={order.id} status={order.status} />
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">
                {customer?.name || address?.name || "Guest"}
              </p>
              {customer?.email && (
                <p className="text-muted-foreground">{customer.email}</p>
              )}
              {customer?.phone && (
                <p className="text-muted-foreground">{customer.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {order.paymentStatus ?? "PENDING"}
                </span>
              </p>
              {order.paymentMethod && <p>Method: {order.paymentMethod}</p>}
            </CardContent>
          </Card>

          {/* Shipping address */}
          {address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{address.street}</p>
                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.zip}
                </p>
                <p>{address.country}</p>
                {(order.shippingMethod || order.trackingNumber) && (
                  <p className="flex items-center gap-1 pt-2">
                    <Truck className="h-3 w-3" />
                    {order.shippingMethod || "Shipping"}
                    {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
