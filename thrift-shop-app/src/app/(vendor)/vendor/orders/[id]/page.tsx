/**
 * Vendor Order Detail
 * View a single order and update its fulfilment status.
 */
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared";
import { useMyVendorOrder } from "@/hooks/useVendors";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils";

// Statuses a vendor can transition an order to (matches UpdateOrderStatusDto).
type VendorOrderStatus =
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const STATUS_FLOW: VendorOrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// The generated OrderResponseDto omits a few relations the API actually
// returns (buyer, guestInfo, items with product). Describe just what we read.
interface VendorOrderView {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  createdAt?: string;
  guestInfo?: { name?: string; email?: string; phone?: string } | null;
  buyer?: { name?: string; email?: string; phone?: string } | null;
  shippingAddress?: Record<string, string>;
  items?: Array<{
    id: string;
    quantity: number;
    price: number | string;
    product?: { name?: string };
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: orderRaw, isLoading } = useMyVendorOrder(id);
  const order = orderRaw as unknown as VendorOrderView | undefined;
  const updateStatus = useUpdateOrderStatus();
  const [pendingStatus, setPendingStatus] = useState<string>("");

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

  const handleStatusChange = (status: string) => {
    setPendingStatus(status);
    updateStatus.mutate(
      { id: order.id, data: { status: status as VendorOrderStatus } },
      {
        onSuccess: () => toast.success(`Order marked ${status.toLowerCase()}`),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to update status"
          ),
        onSettled: () => setPendingStatus(""),
      }
    );
  };

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
        <Badge className="ml-auto">{order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">
                      {item.product?.name || "Product"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.quantity * Number(item.price))}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Update status */}
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value=""
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      pendingStatus ? "Updating…" : "Change status…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <p className="font-medium">{customer?.name || "Guest"}</p>
              {customer?.email && (
                <p className="text-muted-foreground">{customer.email}</p>
              )}
              {customer?.phone && (
                <p className="text-muted-foreground">{customer.phone}</p>
              )}
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
              <CardContent className="text-sm text-muted-foreground">
                <p>{address.street}</p>
                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.zip}
                </p>
                <p>{address.country}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
