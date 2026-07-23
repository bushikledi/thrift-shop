"use client";

/**
 * Chart building blocks shared by the admin and vendor analytics pages.
 *
 * Colour roles are declared once as CSS custom properties and swapped for dark
 * mode, so charts are written against roles rather than raw hex. The palette is
 * the validated categorical default: slot 1 (blue) and slot 3 (aqua). Each
 * chart plots a single series, so no two series are ever compared by colour
 * alone, and every chart ships a table view - required because light-mode aqua
 * sits below 3:1 against the surface.
 */

import { useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, TableIcon } from "lucide-react";

export type SeriesPoint = { date: string; revenue: number; orders: number };
export type NamedTotal = { name: string; revenue: number; orders: number };

/** Series colour roles, resolved from CSS variables set in chart-theme.css. */
export const CHART_COLORS = {
  revenue: "var(--chart-series-1)",
  orders: "var(--chart-series-3)",
} as const;

const AXIS_TICK = {
  fill: "var(--chart-text-secondary)",
  fontSize: 12,
};

function formatDay(value: string): string {
  // "2026-07-23" -> "Jul 23"
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Card wrapper that pairs every chart with a table view.
 *
 * The table is the accessible equivalent of the plot, not a decoration: it is
 * how the data stays readable for colour-vision and print cases.
 */
function ChartCard({
  title,
  description,
  children,
  table,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  table: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTable((value) => !value)}
          aria-pressed={showTable}
        >
          {showTable ? (
            <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <TableIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {showTable ? "Chart" : "Table"}
        </Button>
      </CardHeader>
      <CardContent>
        {showTable ? (
          <div className="max-h-[300px] overflow-auto">{table}</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  format,
  formatLabel,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  valueLabel: string;
  format: (value: number) => string;
  formatLabel?: (value: string) => string;
}) {
  if (!active || !payload?.length) return null;

  const heading =
    formatLabel && typeof label === "string" ? formatLabel(label) : label;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{heading}</p>
      {/* Text keeps text tokens; the value is not painted in the series hue. */}
      <p className="text-muted-foreground">
        {valueLabel}: {format(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

/**
 * Change over time, one measure per chart.
 *
 * Revenue and orders are deliberately separate charts rather than one chart
 * with two y-axes: they are different scales, and a dual axis lets the reader
 * infer a relationship the data does not support.
 */
export function TimeSeriesChart({
  title,
  description,
  data,
  metric,
  format,
}: {
  title: string;
  description?: string;
  data: SeriesPoint[];
  metric: "revenue" | "orders";
  format: (value: number) => string;
}) {
  const color = CHART_COLORS[metric];
  const label = metric === "revenue" ? "Revenue" : "Orders";
  const gradientId = `fill-${metric}`;

  return (
    <ChartCard
      title={title}
      description={description}
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">{label}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((point) => (
              <TableRow key={point.date}>
                <TableCell>{formatDay(point.date)}</TableCell>
                <TableCell className="text-right">
                  {format(point[metric])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Recessive grid: horizontal only, no vertical rules. */}
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDay(value)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => format(value)}
          />
          <Tooltip
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
            content={
              <ChartTooltip
                valueLabel={label}
                format={format}
                formatLabel={formatDay}
              />
            }
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            // Markers appear on hover only, at the >=8px minimum.
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Magnitude ranked by identity. One measure, so a single hue across all bars -
 * colouring each bar differently would imply a categorical encoding that
 * carries no information.
 */
export function RankedBarChart({
  title,
  description,
  data,
  format,
  emptyMessage = "No activity in this period yet.",
}: {
  title: string;
  description?: string;
  data: NamedTotal[];
  format: (value: number) => string;
  emptyMessage?: string;
}) {
  return (
    <ChartCard
      title={title}
      description={description}
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right">
                  {format(row.revenue)}
                </TableCell>
                <TableCell className="text-right">{row.orders}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    >
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => format(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.3 }}
              content={
                <ChartTooltip valueLabel="Revenue" format={format} />
              }
            />
            {/* 4px rounded data-end, anchored square to the baseline. */}
            <Bar
              dataKey="revenue"
              radius={[0, 4, 4, 0]}
              barSize={18}
              fill={CHART_COLORS.revenue}
            >
              {data.map((row) => (
                <Cell key={row.name} fill={CHART_COLORS.revenue} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
