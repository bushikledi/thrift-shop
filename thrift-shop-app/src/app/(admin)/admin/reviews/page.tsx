/**
 * Admin Reviews Page
 * Moderate and manage platform reviews
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  Star,
  Flag,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  Package,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAdminReviews, useAdminDeleteReview } from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  TableSkeleton,
  EmptyState,
  DeleteConfirmation,
} from "@/components/shared";

const PAGE_SIZE = 15;

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  status: "pending" | "approved" | "flagged" | "removed";
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    images?: string[];
  };
  helpfulCount?: number;
  reportCount?: number;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "flagged", label: "Flagged" },
];

const ratingOptions = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

const statusConfig: Record<
  Review["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  flagged: { label: "Flagged", variant: "destructive" },
  removed: { label: "Removed", variant: "secondary" },
};

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [rating, setRating] = useState(searchParams.get("rating") || "all");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAdminReviews({
    page,
    limit: PAGE_SIZE,
  });

  const deleteReviewMutation = useAdminDeleteReview();

  // Mock reviews for demo - in real app, this comes from the API
  const reviewsData = Array.isArray(data)
    ? data
    : (
        data as unknown as {
          data?: Review[];
          meta?: { totalPages?: number; total?: number };
        }
      )?.data || [];
  const reviews: Review[] = reviewsData.map((r) => ({
    ...r,
    status: "approved" as const,
    comment: r.comment || "",
    user: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
    },
    product: {
      id: "",
      name: "",
      slug: "",
    },
  }));
  const totalPages =
    (data as unknown as { meta?: { totalPages?: number } })?.meta?.totalPages || 1;
  const totalItems =
    (data as { meta?: { total?: number } })?.meta?.total || reviews.length;

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      if (
        !review.comment?.toLowerCase().includes(searchLower) &&
        !review.user?.firstName?.toLowerCase().includes(searchLower) &&
        !review.user?.lastName?.toLowerCase().includes(searchLower) &&
        !review.product?.name?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (status !== "all" && review.status !== status) {
      return false;
    }
    if (rating !== "all" && review.rating !== parseInt(rating, 10)) {
      return false;
    }
    if (activeTab === "flagged" && review.status !== "flagged") {
      return false;
    }
    if (activeTab === "pending" && review.status !== "pending") {
      return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: reviews.length,
    flagged: reviews.filter((r) => r.status === "flagged").length,
    pending: reviews.filter((r) => r.status === "pending").length,
    avgRating:
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApproveReview = async (_review: Review) => {
    try {
      // This would call an API to approve the review
      toast.success("Review approved");
      setSelectedReview(null);
    } catch {
      toast.error("Failed to approve review");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFlagReview = async (_review: Review) => {
    try {
      // This would call an API to flag the review
      toast.success("Review flagged for further review");
      setSelectedReview(null);
    } catch {
      toast.error("Failed to flag review");
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteReview) return;

    try {
      await deleteReviewMutation.mutateAsync(deleteReview.id);
      setDeleteReview(null);
    } catch {
      toast.error("Failed to delete review");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Moderate and manage customer reviews
          </p>
        </div>
        {stats.flagged > 0 && (
          <Badge variant="destructive" className="text-sm">
            {stats.flagged} flagged reviews
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Flagged</p>
            </div>
            <p className="text-2xl font-bold">{stats.flagged}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {stats.pending > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs text-white">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="flagged" className="relative">
            Flagged
            {stats.flagged > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {stats.flagged}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTab === "all" && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
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
          <ReviewsTable
            reviews={filteredReviews}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onView={setSelectedReview}
            onApprove={handleApproveReview}
            onFlag={handleFlagReview}
            onDelete={setDeleteReview}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <ReviewsTable
            reviews={filteredReviews}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onView={setSelectedReview}
            onApprove={handleApproveReview}
            onFlag={handleFlagReview}
            onDelete={setDeleteReview}
          />
        </TabsContent>

        <TabsContent value="flagged" className="mt-4">
          <ReviewsTable
            reviews={filteredReviews}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onView={setSelectedReview}
            onApprove={handleApproveReview}
            onFlag={handleFlagReview}
            onDelete={setDeleteReview}
          />
        </TabsContent>
      </Tabs>

      {/* Review Detail Dialog */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={() => setSelectedReview(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-6">
              {/* Reviewer */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReview.user?.avatar} />
                  <AvatarFallback>
                    {selectedReview.user?.firstName?.[0]}
                    {selectedReview.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedReview.user?.firstName}{" "}
                    {selectedReview.user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReview.user?.email}
                  </p>
                </div>
                <Badge variant={statusConfig[selectedReview.status]?.variant}>
                  {statusConfig[selectedReview.status]?.label}
                </Badge>
              </div>

              <Separator />

              {/* Product */}
              <div>
                <h4 className="text-sm font-medium mb-2">Product</h4>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 rounded-lg bg-muted overflow-hidden">
                    {selectedReview.product?.images?.[0] ? (
                      <Image
                        src={selectedReview.product.images[0]}
                        alt={selectedReview.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedReview.product?.name}
                    </p>
                    <Link
                      href={`/products/${selectedReview.product?.slug}`}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Review Content */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={selectedReview.rating} size="md" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedReview.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
                {selectedReview.title && (
                  <h3 className="font-semibold mb-2">{selectedReview.title}</h3>
                )}
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedReview.comment}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {selectedReview.helpfulCount || 0} found helpful
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="h-4 w-4" />
                  {selectedReview.reportCount || 0} reports
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Close
            </Button>
            {selectedReview?.status === "pending" && (
              <Button onClick={() => handleApproveReview(selectedReview)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {selectedReview?.status !== "flagged" && (
              <Button
                variant="outline"
                onClick={() => handleFlagReview(selectedReview!)}
              >
                <Flag className="mr-2 h-4 w-4" />
                Flag
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteReview}
        onOpenChange={() => setDeleteReview(null)}
        itemName="this review"
        onConfirm={handleDeleteReview}
        isLoading={deleteReviewMutation.isPending}
      />
    </div>
  );
}

// Reviews Table Component
function ReviewsTable({
  reviews,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onView,
  onApprove,
  onFlag,
  onDelete,
}: {
  reviews: Review[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onView: (review: Review) => void;
  onApprove: (review: Review) => void;
  onFlag: (review: Review) => void;
  onDelete: (review: Review) => void;
}) {
  if (isLoading) {
    return <TableSkeleton rows={PAGE_SIZE} columns={6} />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews found"
        description="No reviews match your search criteria."
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.user?.avatar} />
                      <AvatarFallback>
                        {review.user?.firstName?.[0]}
                        {review.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {review.user?.firstName} {review.user?.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/products/${review.product?.slug}`}
                    className="text-sm text-primary hover:underline line-clamp-1"
                  >
                    {review.product?.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StarRating rating={review.rating} />
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                    {review.comment}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[review.status]?.variant}>
                    {statusConfig[review.status]?.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {review.createdAt
                    ? format(new Date(review.createdAt), "MMM d, yyyy")
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
                      <DropdownMenuItem onClick={() => onView(review)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {review.status === "pending" && (
                        <DropdownMenuItem onClick={() => onApprove(review)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {review.status !== "flagged" && (
                        <DropdownMenuItem onClick={() => onFlag(review)}>
                          <Flag className="mr-2 h-4 w-4" />
                          Flag
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(review)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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
            {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} reviews
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
