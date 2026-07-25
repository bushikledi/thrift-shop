/**
 * Vendor Dashboard Page
 * Overview of vendor store performance
 */
"use client";

import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useMyVendorAnalytics,
  useMyVendorOrders,
  useMyVendorStats,
} from "@/hooks/useVendors";
import { LoadingSkeleton } from "@/components/shared";
import { orderStatusMeta } from "@/lib/order-status";

const TOP_PRODUCT_WINDOW_DAYS = 30;

export default function VendorDashboardPage() {
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useMyVendorOrders({
    page: 1,
    limit: 5,
  });
  const { data: statsData, isLoading: statsLoading } = useMyVendorStats();
  // "Top products" used to be the first page of the product list — i.e. the
  // most recently created listings, in no particular order, labelled
  // "best-selling". Use the analytics ranking, which is by actual revenue.
  const { data: analytics, isLoading: topProductsLoading } =
    useMyVendorAnalytics(TOP_PRODUCT_WINDOW_DAYS);

  const orders = ordersData?.data ?? [];
  const topProducts = analytics?.topProducts ?? [];

  // Handle vendor profile not found error
  if (ordersError instanceof Error && ordersError.message.includes("vendor")) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-4">Vendor Profile Not Found</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          It looks like you have a vendor account but your vendor profile hasn&apos;t been set up yet.
          Please contact support to complete your vendor setup.
        </p>
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  // Real totals from the vendor stats endpoint.
  const stats = {
    totalRevenue: Number(statsData?.totalRevenue ?? 0),
    totalOrders: statsData?.totalOrders ?? 0,
    activeProducts: statsData?.activeProducts ?? 0,
    totalProducts: statsData?.totalProducts ?? 0,
    pendingOrders: statsData?.pendingOrders ?? 0,
  };

  const archivedProducts = Math.max(
    stats.totalProducts - stats.activeProducts,
    0
  );
  const isLoading = ordersLoading || statsLoading;

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      hint: "Delivered orders",
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      hint: "All time",
      icon: ShoppingCart,
    },
    {
      title: "Active Products",
      // Was the total listing count, archived ones included.
      value: stats.activeProducts.toString(),
      hint: archivedProducts
        ? `${archivedProducts} archived`
        : "In your store",
      icon: Package,
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      hint: "Awaiting fulfillment",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendor/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: { id: string; orderNumber?: string; total?: number; status?: string; createdAt?: string }) => {
                  const meta = orderStatusMeta(order.status ?? "PENDING");
                  return (
                    <Link
                      key={order.id}
                      href={`/vendor/orders/${order.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Order #{order.orderNumber}
                          </p>
                          {/* The total used to be printed here *and* on the
                              right of the same row. Show the date instead. */}
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt ? formatDate(order.createdAt) : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(order.total ?? 0)}
                        </p>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best sellers, last {TOP_PRODUCT_WINDOW_DAYS} days
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendor/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topProductsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {stats.totalProducts === 0
                    ? "No products yet"
                    : "No sales in this period yet"}
                </p>
                {stats.totalProducts === 0 && (
                  <Button className="mt-4" asChild>
                    <Link href="/vendor/products/new">
                      Add your first product
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <p className="line-clamp-1 font-medium">{product.name}</p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="font-medium">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.orders}{" "}
                        {product.orders === 1 ? "order" : "orders"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/vendor/products/new">
                <Package className="h-5 w-5" />
                <span>Add Product</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/vendor/orders">
                <ShoppingCart className="h-5 w-5" />
                <span>View Orders</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/vendor/analytics">
                <TrendingUp className="h-5 w-5" />
                <span>View Analytics</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/vendor/settings">
                <Clock className="h-5 w-5" />
                <span>Store Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
