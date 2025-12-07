/**
 * Product Reviews Component
 * Displays and allows submitting product reviews
 */
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Star, ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Progress component not available - using alternative UI
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useProductReviews, useCreateReview } from "@/hooks/useReviews";
import { useAuthStore } from "@/lib/stores/auth-store";
import { EmptyReviews, LoadingSkeleton } from "@/components/shared";
import type { ReviewResponseDto } from "@/types";

interface ProductReviewsProps {
  productId: string;
}

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review must be less than 1000 characters"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: reviewsData, isLoading } = useProductReviews(productId, {
    page: 1,
    limit: 100,
  });
  const createReview = useCreateReview();

  const reviews = reviewsData?.data || [];
  const totalReviews = reviews.length;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage:
      totalReviews > 0
        ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100
        : 0,
  }));

  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const selectedRating = useWatch({ control, name: "rating" });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await createReview.mutateAsync({
        productId,
        rating: data.rating,
        comment: data.comment,
      });
      toast.success("Review submitted successfully!");
      reset();
      setShowReviewForm(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Rating Overview */}
        <div className="rounded-lg border p-6 text-center">
          <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="w-12 text-sm">{star} stars</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-muted-foreground">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button/Form */}
      {isAuthenticated ? (
        <>
          {!showReviewForm ? (
            <Button onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          ) : (
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-lg font-semibold">Write Your Review</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Star Rating */}
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue("rating", star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            star <= selectedRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted hover:fill-yellow-200 hover:text-yellow-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {errors.rating && (
                    <p className="text-sm text-destructive">
                      {errors.rating.message}
                    </p>
                  )}
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <Label htmlFor="comment">Your Review</Label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience with this product..."
                    rows={4}
                    {...register("comment")}
                  />
                  {errors.comment && (
                    <p className="text-sm text-destructive">
                      {errors.comment.message}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createReview.isPending}>
                    {createReview.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setShowReviewForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground">
            Please{" "}
            <a href="/login" className="text-primary hover:underline">
              sign in
            </a>{" "}
            to write a review.
          </p>
        </div>
      )}

      <Separator />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewResponseDto;
}

function ReviewCard({ review }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(false);

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.user?.avatar} />
            <AvatarFallback>
              {review.user?.name?.[0] || review.user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {review.user?.name || review.user?.email || "Anonymous"}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-muted-foreground">{review.comment}</p>

      <div className="mt-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHelpful(!helpful)}
          className={cn(helpful && "text-primary")}
        >
          <ThumbsUp className={cn("mr-2 h-4 w-4", helpful && "fill-current")} />
          Helpful
        </Button>
      </div>
    </div>
  );
}

export default ProductReviews;
