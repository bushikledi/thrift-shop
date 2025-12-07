/**
 * Vendors Listing Page
 * Browse all verified vendors on the platform
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  Grid,
  List,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useVendors } from "@/hooks/useVendors";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  LoadingSkeleton,
  EmptyState,
} from "@/components/shared";
import type { VendorSummaryDto } from "@/types";

const PAGE_SIZE = 12;

const sortOptions = [
  { value: "rating", label: "Highest Rated" },
  { value: "products", label: "Most Products" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A-Z" },
];

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useVendors({
    page,
    limit: PAGE_SIZE,
    // search is not supported by vendor list params
    verified: true,
  });

  const vendors = Array.isArray(data) ? data : (data as unknown as { data?: VendorSummaryDto[]; meta?: { totalPages?: number; total?: number } })?.data || [];
  const totalPages = (data as { meta?: { totalPages?: number } })?.meta?.totalPages || 1;
  const totalItems = (data as { meta?: { total?: number } })?.meta?.total || vendors.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Our Vendors</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover unique products from our verified sellers. Each vendor brings
          their own style and expertise to the Thrift Shop marketplace.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
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
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {totalItems} {totalItems === 1 ? "vendor" : "vendors"} found
      </p>

      {/* Vendors Grid/List */}
      {isLoading ? (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              className={viewMode === "grid" ? "h-[280px]" : "h-[150px]"}
            />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors found"
          description={
            debouncedSearch
              ? `No vendors match "${debouncedSearch}". Try a different search.`
              : "There are no vendors to display at the moment."
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="overflow-hidden group hover:shadow-lg transition-shadow"
            >
              {/* Banner/Cover Image */}
              <div className="relative h-24 bg-gradient-to-r from-primary/20 to-primary/5">
                {/* Avatar overlapping */}
                <Avatar className="absolute -bottom-8 left-4 h-16 w-16 border-4 border-background">
                  <AvatarFallback className="text-xl">
                    {vendor.displayName?.[0] || "V"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardContent className="pt-12 pb-4">
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="font-semibold text-lg hover:underline line-clamp-1"
                >
                  {vendor.displayName}
                </Link>

                <div className="flex items-center gap-4 mt-4 text-sm">
                  {vendor.verified && (
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href={`/vendors/${vendor.id}`}>
                    Visit Store
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarFallback className="text-xl">
                      {vendor.displayName?.[0] || "V"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {vendor.displayName}
                        </Link>
                        {vendor.verified && (
                          <Badge variant="default" className="text-xs mt-1">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        <Link href={`/vendors/${vendor.id}`}>Visit Store</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
