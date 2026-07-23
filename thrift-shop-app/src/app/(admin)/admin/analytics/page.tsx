/**
 * Admin Analytics Page
 * Platform analytics and insights
 */
"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Store,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminStats, useAdminAnalytics } from "@/hooks/useAdmin";
import { TimeSeriesChart, RankedBarChart } from "@/components/charts";
import { LoadingSkeleton } from "@/components/shared";
import { formatCurrency } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  // The selector drives the analytics window, so changing it refetches.
  const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
  const { data: stats, isLoading } = useAdminStats();
  const { data: analytics } = useAdminAnalytics(days);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: 0,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Total Users",
      value: (stats?.totalUsers || 0).toLocaleString(),
      change: 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Vendors",
      value: (stats?.totalVendors || 0).toLocaleString(),
      change: 0,
      icon: Store,
      color: "text-purple-500",
    },
    {
      title: "Total Orders",
      value: (stats?.totalOrders || 0).toLocaleString(),
      change: 0,
      icon: ShoppingCart,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Platform insights and performance metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== 0 && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metric.change > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      metric.change > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    {Math.abs(metric.change)}% from last period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts. Revenue and orders are separate charts on purpose: they are
          different scales, and a shared axis would imply a relationship the
          data does not support. */}
      <div className="grid gap-6 md:grid-cols-2">
        <TimeSeriesChart
          title="Revenue"
          description={`Delivered-order revenue, last ${days} days`}
          data={analytics?.series ?? []}
          metric="revenue"
          format={formatCurrency}
        />
        <TimeSeriesChart
          title="Orders"
          description={`Orders placed, last ${days} days`}
          data={analytics?.series ?? []}
          metric="orders"
          format={(value) => value.toLocaleString()}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RankedBarChart
          title="Top Categories"
          description="By revenue in this period"
          data={analytics?.topCategories ?? []}
          format={formatCurrency}
        />
        <RankedBarChart
          title="Top Vendors"
          description="By revenue in this period"
          data={analytics?.topVendors ?? []}
          format={formatCurrency}
        />
      </div>
    </div>
  );
}

