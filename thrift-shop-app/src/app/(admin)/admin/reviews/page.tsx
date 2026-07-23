/**
 * Admin Reviews Page
 * Browse and manage platform reviews.
 *
 * Note: the backend currently exposes review listing + deletion only. There is
 * no server-side moderation state (approve/flag), so this page surfaces the real
 * data (reviewer, product, rating, verified-purchase flag) and supports deletion.
 * A full moderation workflow (approve/flag with a persisted status) is tracked as
 * a follow-up once the API gains a review moderation status.
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  Star,
  Trash2,
  Eye,
  MessageSquare,
  BadgeCheck,
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
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  product?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  vendor?: {
    id: string;
    displayName: string;
  } | null;
}

/** Raw review shape returned by the admin API. */
interface ApiReview {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified?: boolean;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string | null };
  product?: { id: string; title: string; slug: string } | null;
  vendor?: { id: string; displayName: string } | null;
}

const verifiedOptions = [
  { value: "all", label: "All Reviews" },
  { value: "verified", label: "Verified purchase" },
  { value: "unverified", label: "Unverified" },
];

const ratingOptions = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const [verified, setVerified] = useState(
    searchParams.get("verified") || "all"
  );
  const [rating, setRating] = useState(searchParams.get("rating") || "all");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAdminReviews({
    page,
    limit: PAGE_SIZE,
  });

  const deleteReviewMutation = useAdminDeleteReview();

  const response = data as unknown as {
    data?: ApiReview[];
    meta?: { totalPages?: number; total?: number };
  };
  const rawReviews: ApiReview[] = Array.isArray(data)
    ? (data as unknown as ApiReview[])
    : response?.data || [];

  const reviews: Review[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title ?? null,
    comment: r.comment ?? null,
    isVerified: Boolean(r.isVerified),
    createdAt: r.createdAt,
    user: {
      id: r.user?.id ?? "",
      name: r.user?.name ?? "Unknown user",
      email: r.user?.email ?? "",
      avatar: r.user?.avatar ?? null,
    },
    product: r.product ?? null,
    vendor: r.vendor ?? null,
  }));

  const totalPages = response?.meta?.totalPages || 1;
  const totalItems = response?.meta?.total || reviews.length;

  // Client-side refinement of the current page.
  const filteredReviews = reviews.filter((review) => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      if (
        !review.comment?.toLowerCase().includes(searchLower) &&
        !review.title?.toLowerCase().includes(searchLower) &&
        !review.user.name.toLowerCase().includes(searchLower) &&
        !review.product?.title?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (verified === "verified" && !review.isVerified) {
      return false;
    }
    if (verified === "unverified" && review.isVerified) {
      return false;
    }
    if (rating !== "all" && review.rating !== parseInt(rating, 10)) {
      return false;
    }
    return true;
  });

  // Stats for the current page of reviews.
  const stats = {
    total: totalItems,
    verified: reviews.filter((r) => r.isVerified).length,
    unverified: reviews.filter((r) => !r.isVerified).length,
    avgRating:
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0,
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
            Browse and manage customer reviews
          </p>
        </div>
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
              <p className="text-sm text-muted-foreground">
                Avg Rating (page)
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Verified (page)
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.verified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Unverified (page)
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.unverified}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
        <Select value={verified} onValueChange={setVerified}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            {verifiedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReviewsTable
        reviews={filteredReviews}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        onView={setSelectedReview}
        onDelete={setDeleteReview}
      />

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
                  <AvatarImage src={selectedReview.user.avatar ?? undefined} />
                  <AvatarFallback>
                    {initialsFromName(selectedReview.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedReview.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReview.user.email}
                  </p>
                </div>
                {selectedReview.isVerified && (
                  <Badge variant="default">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    Verified purchase
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Product / Vendor */}
              <div>
                <h4 className="text-sm font-medium mb-2">Subject</h4>
                {selectedReview.product ? (
                  <Link
                    href={`/products/${selectedReview.product.slug}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedReview.product.title}
                  </Link>
                ) : selectedReview.vendor ? (
                  <p className="text-sm">{selectedReview.vendor.displayName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
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
                  {selectedReview.comment || "No comment provided."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Close
            </Button>
            {selectedReview && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteReview(selectedReview);
                  setSelectedReview(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
  onDelete,
}: {
  reviews: Review[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onView: (review: Review) => void;
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
              <TableHead>Verified</TableHead>
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
                      <AvatarImage src={review.user.avatar ?? undefined} />
                      <AvatarFallback>
                        {initialsFromName(review.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {review.user.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {review.product ? (
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="text-sm text-primary hover:underline line-clamp-1"
                    >
                      {review.product.title}
                    </Link>
                  ) : review.vendor ? (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {review.vendor.displayName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StarRating rating={review.rating} />
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                    {review.comment || "—"}
                  </p>
                </TableCell>
                <TableCell>
                  {review.isVerified ? (
                    <Badge variant="default">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
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
