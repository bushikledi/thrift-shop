/**
 * Admin Orders Page
 * Manage and monitor platform orders
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminOrders } from "@/hooks/useAdmin";
import { Pagination, TableSkeleton, EmptyState } from "@/components/shared";
import type {
  OrderResponseDto as Order,
  OrderStatus as OrderStatusType,
} from "@/types";

const PAGE_SIZE = 15;

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  confirmed: { label: "Confirmed", variant: "secondary", icon: CheckCircle },
  processing: { label: "Processing", variant: "secondary", icon: RefreshCw },
  shipped: { label: "Shipped", variant: "default", icon: Truck },
  delivered: { label: "Delivered", variant: "default", icon: Package },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  refunded: { label: "Refunded", variant: "destructive", icon: RefreshCw },
};

const sortOptions = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "total:desc", label: "Amount: High to Low" },
  { value: "total:asc", label: "Amount: Low to High" },
];

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [sort, setSort] = useState(
    searchParams.get("sort") || "createdAt:desc"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useAdminOrders({
    page,
    limit: PAGE_SIZE,
    status:
      status !== "all" ? (status.toUpperCase() as OrderStatusType) : undefined,
    // sortBy and sortOrder are not supported by AdminOrdersParams
  });

  const orders = Array.isArray(data)
    ? data
    : (data as unknown as { data?: Order[] })?.data || [];
  const totalPages =
    (data as { meta?: { totalPages?: number } })?.meta?.totalPages || 1;
  const totalItems =
    (data as { meta?: { total?: number } })?.meta?.total || orders.length;

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "PROCESSING"
    ).length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = [
      "Order Number",
      "Status",
      "Payment Status",
      "Total",
      "Created At",
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = orders.map((o) =>
      [
        o.orderNumber,
        o.status,
        (o as { paymentStatus?: string }).paymentStatus ?? "",
        o.total,
        o.createdAt,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  const getStatusIcon = (orderStatus: string) => {
    const config = statusConfig[orderStatus as OrderStatus];
    return config?.icon || Clock;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Monitor and manage all platform orders
          </p>
        </div>
        <Button variant="outline" onClick={handleExportOrders}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
            <p className="text-2xl font-bold">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">Shipped</p>
            </div>
            <p className="text-2xl font-bold">{stats.shipped}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
            <p className="text-2xl font-bold">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={7} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="No orders match your search criteria."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const statusInfo =
                    statusConfig[order.status as OrderStatus] ||
                    statusConfig.pending;

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          #{order.orderNumber || order.id.slice(0, 8)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {order.customer?.name?.[0] || "G"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {order.customer?.name || "Guest"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.customer?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">
                        ${Number(order.total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.createdAt
                          ? format(new Date(order.createdAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/orders/${order.id}`}
                                target="_blank"
                              >
                                <Package className="mr-2 h-4 w-4" />
                                Customer View
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
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
        </>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Order #
              {selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}
            </SheetTitle>
            <SheetDescription>
              {selectedOrder?.createdAt
                ? format(
                    new Date(selectedOrder.createdAt),
                    "MMMM d, yyyy 'at' h:mm a"
                  )
                : "-"}
            </SheetDescription>
          </SheetHeader>

          {!selectedOrder ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : selectedOrder ? (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <Badge
                  variant={
                    statusConfig[selectedOrder.status as OrderStatus]
                      ?.variant || "outline"
                  }
                  className="text-sm"
                >
                  {statusConfig[selectedOrder.status as OrderStatus]?.label ||
                    selectedOrder.status}
                </Badge>
              </div>

              <Separator />

              {/* Customer */}
              <div>
                <h4 className="text-sm font-medium mb-2">Customer</h4>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedOrder.customer?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedOrder.customer?.name || "Guest"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.customer?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                {selectedOrder.shippingAddress ? (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {selectedOrder.shippingAddress.address ||
                        selectedOrder.shippingAddress.fullName}
                    </p>
                    <p>
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.state}{" "}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipping address provided
                  </p>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × $
                          {Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.quantity * Number(item.price || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div>
                <h4 className="text-sm font-medium mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      ${Number(selectedOrder.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      ${Number(selectedOrder.shipping || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${Number(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${Number(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
