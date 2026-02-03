"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Skeleton,
  Separator,
} from "@/shared/ui";
import { Star, User } from "lucide-react";
import { useCourseReviews, type CourseReviewItem } from "@/entities/review";
import { StarRating } from "./star-rating";

interface CourseReviewsSectionProps {
  slug: string;
  reviewCount: number;
  averageRating: number;
}

export function CourseReviewsSection({
  slug,
  reviewCount,
  averageRating,
}: CourseReviewsSectionProps) {
  const t = useTranslations("course");
  const tReview = useTranslations("review");
  const [page, setPage] = useState(1);
  const { reviews, hasMore, isLoading } = useCourseReviews(slug, page);

  const handleShowMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // Don't render section if no reviews exist
  if (reviewCount === 0 && !isLoading) return null;

  return (
    <section className="mb-8">
      <Separator className="mb-8" />

      {/* Header with average rating */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">{tReview("title")}</h2>
        {averageRating > 0 ? (
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-lg font-semibold text-foreground">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({tReview("totalReviews", { count: reviewCount })})
            </span>
          </div>
        ) : null}
      </div>

      {/* Review cards */}
      {isLoading && reviews.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Show more button */}
      {hasMore ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={handleShowMore} disabled={isLoading}>
            {t("detail.reviews.showMore")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ReviewCard({ review }: { review: CourseReviewItem }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString();

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {review.user.avatarUrl ? (
              <AvatarImage src={review.user.avatarUrl} alt={review.user.name ?? ""} />
            ) : null}
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {review.user.name ?? "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <div className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </div>
            {review.title ? (
              <h4 className="mt-2 text-sm font-semibold text-foreground">{review.title}</h4>
            ) : null}
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
