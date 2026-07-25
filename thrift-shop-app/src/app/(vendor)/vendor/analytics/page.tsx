/**
 * Vendor Analytics Page
 * Store performance over a selectable window.
 */
"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
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
import { useMyVendorStats, useMyVendorAnalytics } from "@/hooks/useVendors";
import { TimeSeriesChart, RankedBarChart } from "@/components/charts";
import { LoadingSkeleton } from "@/components/shared";
import { formatCurrency } from "@/lib/utils";

/** Range value → days. "1y" previously fell through to 30. */
const RANGES = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "1y", label: "Last year", days: 365 },
] as const;

/** Percentage change, or null when there is no baseline to compare against. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default function VendorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("30d");
  const days =
    RANGES.find((range) => range.value === timeRange)?.days ?? 30;

  const { data: stats, isLoading: statsLoading } = useMyVendorStats();
  const { data: analytics, isLoading: analyticsLoading } =
    useMyVendorAnalytics(days);

  const isLoading = statsLoading || analyticsLoading;

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

  const rangeLabel =
    RANGES.find((range) => range.value === timeRange)?.label.toLowerCase() ??
    `last ${days} days`;

  // Revenue and orders now come from the selected window, and are compared
  // against the equal-length window before it. Previously these cards showed
  // all-time totals with a hardcoded 0% change, so changing the range moved
  // the charts but left the numbers above them frozen.
  const totals = analytics?.totals ?? { revenue: 0, orders: 0 };
  const previous = analytics?.previous ?? { revenue: 0, orders: 0 };

  const metrics = [
    {
      title: "Revenue",
      value: formatCurrency(totals.revenue),
      hint: `Delivered orders, ${rangeLabel}`,
      change: percentChange(totals.revenue, previous.revenue),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Orders",
      value: totals.orders.toLocaleString(),
      hint: `Placed, ${rangeLabel}`,
      change: percentChange(totals.orders, previous.orders),
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      title: "Active Products",
      // The all-time listing count is not a windowed figure, so it carries no
      // change indicator — and it counts only live listings, not archived ones.
      value: (stats?.activeProducts ?? 0).toLocaleString(),
      hint: `${stats?.totalProducts ?? 0} total incl. archived`,
      change: null,
      icon: Package,
      color: "text-purple-500",
    },
    {
      title: "Pending Orders",
      value: (stats?.pendingOrders ?? 0).toLocaleString(),
      hint: "Awaiting fulfilment, all time",
      change: null,
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your store performance and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
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
              {metric.change !== null && metric.change !== 0 ? (
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
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
                    {Math.abs(Math.round(metric.change))}% vs previous period
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.hint}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and orders are separate charts: different scales, so a shared
          axis would imply a relationship the data does not support. */}
      <div className="grid gap-6 md:grid-cols-2">
        <TimeSeriesChart
          title="Revenue"
          description={`Delivered-order revenue, ${rangeLabel}`}
          data={analytics?.series ?? []}
          metric="revenue"
          format={formatCurrency}
        />
        <TimeSeriesChart
          title="Orders"
          description={`Orders received, ${rangeLabel}`}
          data={analytics?.series ?? []}
          metric="orders"
          format={(value) => value.toLocaleString()}
        />
      </div>

      <RankedBarChart
        title="Top Performing Products"
        description={`Your best-selling products, ${rangeLabel}`}
        data={analytics?.topProducts ?? []}
        format={formatCurrency}
        emptyMessage="No sales in this period yet."
      />
    </div>
  );
}
