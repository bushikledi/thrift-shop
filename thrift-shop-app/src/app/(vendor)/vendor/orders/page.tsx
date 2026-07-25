/**
 * Vendor Orders Page
 * Fulfilment queue: scan orders, see what was bought, advance the status.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, CreditCard, Truck } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils";
import { useMyVendorOrders } from "@/hooks/useVendors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSkeleton, Pagination } from "@/components/shared";
import { OrderStatusSelect } from "@/components/vendor/order-status-select";
import { ORDER_STATUSES, orderStatusMeta } from "@/lib/order-status";

const PAGE_SIZE = 10;

/** Sentinel for "no filter" — Radix rejects an empty SelectItem value. */
const ALL = "all";

/**
 * What /vendors/me/orders actually returns. The endpoint is annotated with
 * OrderResponseDto but serialises the Prisma row, so the generated type is
 * wrong in ways that matter here: the buyer arrives as `buyer` (not
 * `customer`), the address field is `name` (not `fullName`), and each item
 * carries its own title snapshot.
 */
interface VendorOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  total: number | string;
  createdAt: string;
  buyer?: { id: string; name?: string | null; email?: string | null } | null;
  guestInfo?: { name?: string; email?: string } | null;
  shippingAddress?: Record<string, string> | null;
  items?: Array<{
    id: string;
    title?: string | null;
    quantity: number;
    price: number | string;
    product?: {
      slug?: string;
      title?: string;
      media?: Array<{ url: string }>;
    } | null;
  }>;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: "border-green-500/40 text-green-700 dark:text-green-400",
  PENDING: "border-yellow-500/40 text-yellow-700 dark:text-yellow-400",
  FAILED: "border-red-500/40 text-red-700 dark:text-red-400",
  REFUNDED: "border-slate-500/40 text-slate-700 dark:text-slate-300",
};

export default function VendorOrdersPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status")?.toUpperCase() || ALL
  );
  const [page, setPage] = useState(1);

  const { data: ordersData, isLoading } = useMyVendorOrders({
    page,
    limit: PAGE_SIZE,
    // The API takes the Prisma enum. Sending the lowercase label straight from
    // the dropdown reached Prisma unvalidated and came back as a 500.
    status: statusFilter === ALL ? undefined : statusFilter,
  });

  const orders = (ordersData?.data ?? []) as unknown as VendorOrderListItem[];
  const totalPages = ordersData?.meta?.totalPages ?? 1;
  const total = ordersData?.meta?.total ?? 0;

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "order" : "orders"}
            {statusFilter !== ALL
              ? ` · ${orderStatusMeta(statusFilter).label.toLowerCase()}`
              : ""}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All orders</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {orderStatusMeta(status).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-28" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {statusFilter === ALL
                ? "No orders yet"
                : `No ${orderStatusMeta(statusFilter).label.toLowerCase()} orders`}
            </h3>
            <p className="text-center text-muted-foreground">
              {statusFilter === ALL
                ? "Orders from your store will appear here"
                : "Try a different status filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const meta = orderStatusMeta(order.status);
            const StatusIcon = meta.icon;
            const customer =
              order.buyer?.name ||
              order.guestInfo?.name ||
              order.shippingAddress?.name ||
              "Guest";
            const email = order.buyer?.email || order.guestInfo?.email;
            const items = order.items ?? [];
            const itemCount = items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const paymentStatus = order.paymentStatus ?? "PENDING";

            return (
              <Card key={order.id}>
                <CardContent className="space-y-3 p-4">
                  {/* Summary row */}
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/vendor/orders/${order.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          #{order.orderNumber}
                        </Link>
                        <Badge className={meta.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={PAYMENT_STATUS_STYLES[paymentStatus] ?? ""}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          {paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                          {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)} · {customer}
                        {email ? ` · ${email}` : ""}
                      </p>
                      {(order.shippingMethod || order.trackingNumber) && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Truck className="h-3 w-3" />
                          {order.shippingMethod || "Shipping"}
                          {order.trackingNumber
                            ? ` · ${order.trackingNumber}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold leading-none">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <OrderStatusSelect
                        orderId={order.id}
                        status={order.status}
                        size="sm"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vendor/orders/${order.id}`}>Details</Link>
                      </Button>
                    </div>
                  </div>

                  {/* What was actually bought — the whole point of the queue. */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                      {items.map((item) => {
                        const title =
                          item.title || item.product?.title || "Product";
                        const image = item.product?.media?.[0]?.url;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2"
                            title={`${title} — ${formatCurrency(item.price)} each`}
                          >
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
                              {image && (
                                <Image
                                  src={image}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span className="max-w-[220px] truncate text-sm">
                              {title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ×{item.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
