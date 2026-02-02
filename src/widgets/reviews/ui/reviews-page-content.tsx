"use client";

import { useTranslations } from "next-intl";
import { Star, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Skeleton,
} from "@/shared/ui";
import { Link } from "@/i18n/navigation";
import { usePaginatedGlobalReviews } from "@/entities/review";
import type { GlobalReviewItem } from "@/entities/review";

interface ReviewsPageContentProps {
  locale: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, locale }: { review: GlobalReviewItem; locale: string }) {
  const t = useTranslations("review");

  return (
    <Card>
      <CardContent className="p-6">
        <StarRating rating={review.rating} />
        {review.title ? (
          <h3 className="mt-3 font-semibold text-foreground">{review.title}</h3>
        ) : null}
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{review.content}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {review.user.avatarUrl ? (
                <AvatarImage src={review.user.avatarUrl} alt={review.user.name ?? ""} />
              ) : null}
              <AvatarFallback className="text-xs">{(review.user.name ?? "?")[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{review.user.name ?? t("empty")}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Link
              href={`/courses/${review.course.slug}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {review.course.title}
            </Link>
            <time className="text-xs text-muted-foreground/70" dateTime={review.createdAt}>
              {new Date(review.createdAt).toLocaleDateString(locale)}
            </time>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-4 h-4 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReviewsPageContent({ locale }: ReviewsPageContentProps) {
  const t = useTranslations("review");
  const { reviews, total, hasMore, isLoading, isLoadingMore, loadMore } =
    usePaginatedGlobalReviews(12);

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("allReviews")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {total > 0 ? t("totalReviews", { count: total }) : t("recentReviews")}
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <SkeletonGrid />
        ) : reviews.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-foreground">{t("empty")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        ) : (
          <>
            {/* Review grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} locale={locale} />
              ))}
            </div>

            {/* Load more */}
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      {t("allReviews")}
                    </>
                  ) : (
                    t("moreReviews")
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
