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
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
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
import { cn, formatCurrency } from "@/lib/utils";
import { useMyVendorProducts, useMyVendorOrders } from "@/hooks/useVendors";
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

  // Calculate stats (mock data for now - would come from API)
  const stats = {
    totalRevenue: orders.reduce((sum: number, o: { total?: number }) => sum + (o.total || 0), 0),
    revenueChange: 12.5,
    totalOrders: orders.length,
    ordersChange: 8.2,
    totalProducts: products.length,
    productsChange: 3,
    totalViews: 1247,
    viewsChange: -2.4,
  };

  const isLoading = productsLoading || ordersLoading;

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      change: stats.ordersChange,
      icon: ShoppingCart,
    },
    {
      title: "Active Products",
      value: stats.totalProducts.toString(),
      change: stats.productsChange,
      icon: Package,
    },
    {
      title: "Store Views",
      value: stats.totalViews.toLocaleString(),
      change: stats.viewsChange,
      icon: Eye,
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
                <div className="flex items-center text-xs">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={cn(
                      stat.change >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    from last month
                  </span>
                </div>
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
