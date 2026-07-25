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
  User,
  Mail,
  Phone,
  MapPin,
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
import { useAdminOrders, useAdminStats } from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
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
  const [customerOrder, setCustomerOrder] = useState<Order | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // The sort control is "field:direction"; the API takes them separately.
  const [sortBy, sortOrder] = sort.split(":") as [
    "createdAt" | "total" | "status",
    "asc" | "desc",
  ];

  const { data, isLoading } = useAdminOrders({
    page,
    limit: PAGE_SIZE,
    status:
      status !== "all" ? (status.toUpperCase() as OrderStatusType) : undefined,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });
  const { data: adminStats } = useAdminStats();

  const orders = Array.isArray(data)
    ? data
    : (data as unknown as { data?: Order[] })?.data || [];
  const totalPages =
    (data as { meta?: { totalPages?: number } })?.meta?.totalPages || 1;
  const totalItems =
    (data as { meta?: { total?: number } })?.meta?.total || orders.length;

  // Platform-wide counts from /admin/stats. Counting the `orders` array only
  // ever described the current page, so "Total" was really the page size.
  const platformStats = adminStats as
    | { totalOrders?: number; ordersByStatus?: Record<string, number> }
    | undefined;
  const byStatus = platformStats?.ordersByStatus ?? {};
  const stats = {
    total: platformStats?.totalOrders ?? totalItems,
    pending: byStatus.PENDING ?? 0,
    processing: (byStatus.CONFIRMED ?? 0) + (byStatus.PROCESSING ?? 0),
    shipped: byStatus.SHIPPED ?? 0,
    delivered: byStatus.DELIVERED ?? 0,
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
    const config = statusConfig[orderStatus.toLowerCase() as OrderStatus];
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
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
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v);
            setPage(1);
          }}
        >
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
                    statusConfig[order.status.toLowerCase() as OrderStatus] ||
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
                            <DropdownMenuItem
                              onClick={() => setCustomerOrder(order)}
                            >
                              <User className="mr-2 h-4 w-4" />
                              View Customer
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

      {/* Customer Drawer.
          Replaces a link to /orders/[id], which is a shopper-only route — an
          admin following it was bounced straight back to the dashboard. */}
      <Sheet
        open={!!customerOrder}
        onOpenChange={(open) => {
          if (!open) setCustomerOrder(null);
        }}
      >
        <SheetContent className="flex h-full w-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Customer</SheetTitle>
            <SheetDescription>
              Who placed order #
              {customerOrder?.orderNumber || customerOrder?.id?.slice(0, 8)}
            </SheetDescription>
          </SheetHeader>

          {customerOrder && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {customerOrder.customer?.name?.[0] || "G"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">
                    {customerOrder.customer?.name || "Guest checkout"}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {customerOrder.customer?.email || "No account"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h4 className="font-medium">Contact</h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {customerOrder.customer?.email || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>
                    {customerOrder.shippingAddress?.phone || "Not provided"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <h4 className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4" />
                  Shipping address
                </h4>
                {customerOrder.shippingAddress ? (
                  <div className="text-muted-foreground">
                    <p>{customerOrder.shippingAddress.fullName}</p>
                    <p>{customerOrder.shippingAddress.address}</p>
                    <p>
                      {customerOrder.shippingAddress.city},{" "}
                      {customerOrder.shippingAddress.state}{" "}
                      {customerOrder.shippingAddress.postalCode}
                    </p>
                    <p>{customerOrder.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No shipping address recorded
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <h4 className="font-medium">This order</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placed</span>
                  <span>
                    {customerOrder.createdAt
                      ? format(new Date(customerOrder.createdAt), "PP")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{customerOrder.items?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">
                    ${Number(customerOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {customerOrder.customer?.id && (
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(
                      customerOrder.customer.email || ""
                    )}`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Open in Users
                  </Link>
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
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
                    statusConfig[selectedOrder.status.toLowerCase() as OrderStatus]
                      ?.variant || "outline"
                  }
                  className="text-sm"
                >
                  {statusConfig[selectedOrder.status.toLowerCase() as OrderStatus]?.label ||
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
