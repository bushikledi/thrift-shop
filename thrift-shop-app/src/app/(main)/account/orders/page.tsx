/**
 * Account Orders Page
 * View order history
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Package,
  ChevronRight,
  Search,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import { useOrders } from "@/hooks/useOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination, LoadingSkeleton, EmptyState } from "@/components/shared";
import type { OrderResponseDto, OrderItemResponseDto } from "@/types";

const PAGE_SIZE = 10;

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

export default function AccountOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useOrders({
    page,
    limit: PAGE_SIZE,
  });

  const orders = Array.isArray(data) ? data : [];
  const totalPages = 1; // Calculate if needed
  const totalItems = orders.length;

  // Filter by tab
  const filteredOrders = orders.filter((order: OrderResponseDto) => {
    const status = order.status.toLowerCase() as OrderStatus;
    if (activeTab === "active") {
      return ["pending", "confirmed", "processing", "shipped"].includes(status);
    }
    if (activeTab === "completed") {
      return status === "delivered";
    }
    if (activeTab === "cancelled") {
      return ["cancelled", "refunded"].includes(status);
    }
    return true;
  });

  // Search filter
  const searchedOrders = debouncedSearch
    ? filteredOrders.filter(
        (order: OrderResponseDto) =>
          order.orderNumber
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          order.items?.some((item: OrderItemResponseDto) =>
            item.product?.name
              ?.toLowerCase()
              .includes(debouncedSearch.toLowerCase())
          )
      )
    : filteredOrders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-[200px]" />
              ))}
            </div>
          ) : searchedOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders found"
              description={
                activeTab === "all"
                  ? "You haven't placed any orders yet."
                  : `No ${activeTab} orders found.`
              }
              action={
                activeTab === "all"
                  ? {
                      label: "Start Shopping",
                      href: "/shop",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {searchedOrders.map((order: OrderResponseDto) => {
                const statusInfo =
                  statusConfig[order.status.toLowerCase() as OrderStatus] ||
                  statusConfig.pending;
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={order.id}>
                    <CardContent className="p-0">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Order Number
                            </p>
                            <p className="font-mono font-medium">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Placed on
                            </p>
                            <p className="font-medium">
                              {order.createdAt
                                ? format(
                                    new Date(order.createdAt),
                                    "MMM d, yyyy"
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total
                            </p>
                            <p className="font-semibold">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn("gap-1", statusInfo.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Order Items */}
                      <div className="p-4">
                        <div className="space-y-4">
                          {order.items
                            ?.slice(0, 2)
                            .map(
                              (item: OrderItemResponseDto, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-4"
                                >
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                                    {item.product?.images?.[0] ? (
                                      <Image
                                        src={item.product.images[0]}
                                        alt={item.product.name || "Product"}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {item.product?.name || "Product"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Qty: {item.quantity} ×{" "}
                                      {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                  <p className="font-medium">
                                    {formatCurrency(
                                      item.quantity * Number(item.price)
                                    )}
                                  </p>
                                </div>
                              )
                            )}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-sm text-muted-foreground">
                              +{(order.items?.length || 0) - 2} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t bg-muted/50">
                        <div className="flex flex-wrap gap-2">
                          {order.status === "DELIVERED" && (
                            <Button variant="outline" size="sm">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Write Review
                            </Button>
                          )}
                          {["PENDING", "CONFIRMED"].includes(order.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Order
                            </Button>
                          )}
                          {order.status === "DELIVERED" && (
                            <Button variant="outline" size="sm">
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Return
                            </Button>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} orders
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
