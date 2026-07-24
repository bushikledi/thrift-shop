/**
 * Admin Vendors Page
 * Manage vendor accounts and applications
 */
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Store,
  ExternalLink,
  Eye,
  ShieldCheck,
  ShieldX,
  Star,
  RefreshCw,
  Users,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAdminVendors,
  useAdminVerifyVendor,
  useAdminUpdateVendor,
} from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination, TableSkeleton, EmptyState } from "@/components/shared";
import type { VendorDetailDto as Vendor } from "@/types";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
];

export default function AdminVendorsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectVendor, setRejectVendor] = useState<Vendor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch, isFetching } = useAdminVendors({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    verified:
      status === "verified" ? true : status === "pending" ? false : undefined,
    ...(activeTab === "pending" && { verified: false }),
  });

  const verifyVendorMutation = useAdminVerifyVendor();
  const updateVendorMutation = useAdminUpdateVendor();

  const vendors = useMemo(() => {
    if (Array.isArray(data)) return data;
    return (
      (
        data as unknown as {
          data?: Vendor[];
        }
      )?.data || []
    );
  }, [data]);

  const { totalPages, totalItems } = useMemo(() => {
    const meta = (data as { meta?: { totalPages?: number; total?: number } })
      ?.meta;
    return {
      totalPages: meta?.totalPages || 1,
      totalItems: meta?.total || vendors.length,
    };
  }, [data, vendors.length]);

  // Stats
  const stats = useMemo(() => {
    const verified = vendors.filter((v: Vendor) => v.verified).length;
    const pending = vendors.filter((v: Vendor) => !v.verified).length;
    const avgRating =
      vendors.length > 0
        ? vendors.reduce((sum: number, v: Vendor) => sum + (v.rating || 0), 0) /
          vendors.length
        : 0;
    return { verified, pending, avgRating, total: vendors.length };
  }, [vendors]);

  const pendingVendors = useMemo(
    () => vendors.filter((v: Vendor) => !v.verified),
    [vendors]
  );

  const handleVerifyVendor = async (vendor: Vendor) => {
    try {
      await verifyVendorMutation.mutateAsync(vendor.id);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRejectVendor = async () => {
    if (!rejectVendor) return;

    try {
      await updateVendorMutation.mutateAsync({
        id: rejectVendor.id,
        data: { verified: false },
      });
      toast.success("Vendor application rejected");
      setRejectVendor(null);
      setRejectReason("");
    } catch {
      // Error handled by mutation
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Vendors refreshed");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendor accounts and approve applications
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verified} verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Active sellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-500" />
              {stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Vendors</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingVendors.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {pendingVendors.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {activeTab === "all" && (
            <Select value={status} onValueChange={handleStatusFilter}>
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
          )}
        </div>

        <TabsContent value="all" className="mt-4">
          {/* Vendors Table */}
          {isLoading ? (
            <TableSkeleton rows={PAGE_SIZE} columns={5} />
          ) : vendors.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No vendors found"
              description="No vendors match your search criteria."
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Reviews</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor: Vendor) => (
                      <TableRow
                        key={vendor.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedVendor(vendor)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={vendor.logo || undefined} />
                              <AvatarFallback>
                                {vendor.displayName?.[0] || "V"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {vendor.displayName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{vendor.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.verified ? (
                            <Badge
                              variant="default"
                              className="gap-1 bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 text-amber-600 border-amber-300"
                            >
                              <XCircle className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {vendor.rating?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {vendor.reviewCount || 0} reviews
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedVendor(vendor)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!vendor.verified && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleVerifyVendor(vendor)}
                                    disabled={verifyVendorMutation.isPending}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Approve Vendor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setRejectVendor(vendor)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Reject Application
                                  </DropdownMenuItem>
                                </>
                              )}
                              {vendor.verified && (
                                <DropdownMenuItem
                                  onClick={() => setRejectVendor(vendor)}
                                  className="text-destructive"
                                >
                                  <ShieldX className="mr-2 h-4 w-4" />
                                  Revoke Verification
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}{" "}
                    vendors
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
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {/* Pending Applications */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/2 bg-muted rounded" />
                          <div className="h-3 w-1/3 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-20 bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 bg-muted rounded" />
                        <div className="h-9 flex-1 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingVendors.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending applications"
              description="All vendor applications have been reviewed."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingVendors.map((vendor: Vendor) => (
                <Card key={vendor.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={vendor.logo || undefined} />
                          <AvatarFallback>
                            {vendor.displayName?.[0] || "V"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {vendor.displayName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            @{vendor.name}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300"
                      >
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {vendor.bio || "No description provided."}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleVerifyVendor(vendor)}
                        disabled={verifyVendorMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setRejectVendor(vendor)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vendor Detail Sheet */}
      <Sheet
        open={!!selectedVendor}
        onOpenChange={() => setSelectedVendor(null)}
      >
        <SheetContent className="flex h-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Vendor Details</SheetTitle>
            <SheetDescription>
              View and manage vendor information
            </SheetDescription>
          </SheetHeader>

          {selectedVendor && (
            <div className="mt-6 space-y-6">
              {/* Vendor Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedVendor.logo || undefined} />
                  <AvatarFallback className="text-2xl">
                    {selectedVendor.displayName?.[0] || "V"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedVendor.displayName}
                  </h3>
                  <p className="text-muted-foreground">
                    @{selectedVendor.name}
                  </p>
                  {selectedVendor.verified ? (
                    <Badge
                      variant="default"
                      className="mt-2 gap-1 bg-green-500"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2 gap-1">
                      <XCircle className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500" />
                      {selectedVendor.rating?.toFixed(1) || "0.0"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Reviews</p>
                    <p className="text-2xl font-bold">
                      {selectedVendor.reviewCount || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Vendor Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Information</h4>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor ID</span>
                    <span className="font-mono text-xs">
                      {selectedVendor.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slug</span>
                    <span>@{selectedVendor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Verification Status
                    </span>
                    <span>
                      {selectedVendor.verified ? (
                        <Badge variant="default" className="bg-green-500">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedVendor.bio && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVendor.bio}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {!selectedVendor.verified ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleVerifyVendor(selectedVendor);
                        setSelectedVendor(null);
                      }}
                      disabled={verifyVendorMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Vendor
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedVendor(null);
                        setRejectVendor(selectedVendor);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Application
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setSelectedVendor(null);
                      setRejectVendor(selectedVendor);
                    }}
                  >
                    <ShieldX className="mr-2 h-4 w-4" />
                    Revoke Verification
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject/Revoke Vendor Dialog */}
      <Dialog open={!!rejectVendor} onOpenChange={() => setRejectVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectVendor?.verified
                ? "Revoke Vendor Verification"
                : "Reject Vendor Application"}
            </DialogTitle>
            <DialogDescription>
              {rejectVendor?.verified
                ? `Are you sure you want to revoke verification for ${rejectVendor?.displayName}? They will need to be re-verified.`
                : `Please provide a reason for rejecting ${rejectVendor?.displayName}'s application.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                {rejectVendor?.verified ? "Reason (optional)" : "Reason"}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  rejectVendor?.verified
                    ? "Explain why the verification is being revoked..."
                    : "Explain why this application is being rejected..."
                }
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectVendor(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectVendor}
              disabled={
                (!rejectVendor?.verified && !rejectReason.trim()) ||
                updateVendorMutation.isPending
              }
            >
              {updateVendorMutation.isPending
                ? "Processing..."
                : rejectVendor?.verified
                ? "Revoke Verification"
                : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
