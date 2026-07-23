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
import { formatCurrency } from "@/lib/utils";
import {
  useMyVendorProducts,
  useMyVendorOrders,
  useMyVendorStats,
} from "@/hooks/useVendors";
import { LoadingSkeleton } from "@/components/shared";

export default function VendorDashboardPage() {
  const { data: productsData, isLoading: productsLoading, error: productsError } = useMyVendorProducts({
    page: 1,
    limit: 5,
  });
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useMyVendorOrders({
    page: 1,
    limit: 5,
  });
  const { data: statsData, isLoading: statsLoading } = useMyVendorStats();

  const products = Array.isArray(productsData) ? productsData : [];
  const orders = Array.isArray(ordersData) ? ordersData : [];

  // Handle vendor profile not found error
  if (productsError || ordersError) {
    const error = productsError || ordersError;
    if (error instanceof Error && error.message.includes("vendor")) {
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
  }

  // Real totals from the vendor stats endpoint.
  const stats = {
    totalRevenue: Number(statsData?.totalRevenue ?? 0),
    totalOrders: statsData?.totalOrders ?? 0,
    totalProducts: statsData?.totalProducts ?? 0,
    pendingOrders: statsData?.pendingOrders ?? 0,
  };

  const isLoading = productsLoading || ordersLoading || statsLoading;

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
      value: stats.totalProducts.toString(),
      hint: "In your store",
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
                {orders.map((order: { id: string; orderNumber?: string; total?: number; status?: string; createdAt?: string }) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.total ? formatCurrency(order.total) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {order.total ? formatCurrency(order.total) : "N/A"}
                      </p>
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "default"
                            : order.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Your best-selling items</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendor/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No products yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/vendor/products/new">
                    Add your first product
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md bg-muted" />
                      <div>
                        <p className="font-medium line-clamp-1">
                          {product.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} in stock
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} in stock
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
