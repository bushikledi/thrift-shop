/**
 * Admin Dashboard Page
 * Overview of platform metrics and activity
 */
"use client";

import Link from "next/link";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
  Clock,
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
import {
  useAdminStats,
  useAdminUsers,
  useAdminOrders,
} from "@/hooks/useAdmin";
import { LoadingSkeleton } from "@/components/shared";
import type { UserProfileResponseDto, OrderResponseDto } from "@/types";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    limit: 5,
  });
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders({
    limit: 5,
  });

  const recentUsers = Array.isArray(usersData) ? usersData : (usersData as unknown as { data?: UserProfileResponseDto[] })?.data || [];
  const recentOrders = Array.isArray(ordersData) ? ordersData : (ordersData as unknown as { data?: OrderResponseDto[] })?.data || [];

  const isLoading = statsLoading || usersLoading || ordersLoading;

  const newUsersThisMonth = stats?.newUsersThisMonth ?? 0;
  const newOrdersThisMonth = stats?.newOrdersThisMonth ?? 0;
  const pendingVendorVerifications = stats?.pendingVendorVerifications ?? 0;

  // Platform stats (all values come from the real admin stats endpoint).
  const platformStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(Number(stats?.totalRevenue || 0)),
      hint: "From delivered orders",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Total Users",
      value: (stats?.totalUsers || 0).toLocaleString(),
      hint: `+${newUsersThisMonth.toLocaleString()} this month`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Vendors",
      value: (stats?.totalVendors || 0).toLocaleString(),
      hint: `${pendingVendorVerifications.toLocaleString()} pending verification`,
      icon: Store,
      color: "text-purple-500",
    },
    {
      title: "Total Orders",
      value: (stats?.totalOrders || 0).toLocaleString(),
      hint: `+${newOrdersThisMonth.toLocaleString()} this month`,
      icon: ShoppingCart,
      color: "text-orange-500",
    },
    {
      title: "Total Products",
      value: (stats?.totalProducts || 0).toLocaleString(),
      hint: "Listed on the platform",
      icon: Package,
      color: "text-pink-500",
    },
    {
      title: "Pending Verifications",
      value: pendingVendorVerifications.toLocaleString(),
      hint: "Vendors awaiting review",
      icon: ShieldCheck,
      color: "text-cyan-500",
    },
  ];

  // Alerts derived from real data (only shown when actionable).
  const alerts = [
    ...(pendingVendorVerifications > 0
      ? [
          {
            type: "warning" as const,
            message: `${pendingVendorVerifications} vendor${
              pendingVendorVerifications === 1 ? "" : "s"
            } pending verification`,
            link: "/admin/vendors",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and recent activity
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Link
              key={index}
              href={alert.link}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted",
                "border-orange-200 bg-orange-50"
              )}
            >
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="flex-1 text-sm">{alert.message}</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
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
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Newly registered users</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No users yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user: UserProfileResponseDto) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium">
                        {user.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest platform orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order: OrderResponseDto) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer?.name || "Guest"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(order.total)}
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
              <Link href="/admin/users">
                <Users className="h-5 w-5" />
                <span>Manage Users</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/admin/vendors">
                <Store className="h-5 w-5" />
                <span>Manage Vendors</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/admin/products">
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/admin/settings">
                <Clock className="h-5 w-5" />
                <span>Platform Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
