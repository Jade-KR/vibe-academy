"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
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
import type { GlobalReviewItem } from "@/entities/review";

interface ReviewHighlightsSectionProps {
  reviews: GlobalReviewItem[];
  isLoading: boolean;
  hasMore: boolean;
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

export function ReviewHighlightsSection({
  reviews,
  isLoading,
  hasMore,
}: ReviewHighlightsSectionProps) {
  const t = useTranslations("landing");

  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("reviewHighlights.title")}
          </h2>
          {hasMore && (
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link href="/reviews">{t("reviewHighlights.moreLink")}</Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="mb-3 h-4 w-24" />
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
        ) : reviews.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <h3 className="mt-3 font-semibold text-foreground">{review.title}</h3>
                  )}
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {review.content}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {review.user.avatarUrl && (
                          <AvatarImage src={review.user.avatarUrl} alt={review.user.name ?? ""} />
                        )}
                        <AvatarFallback className="text-xs">
                          {(review.user.name ?? "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {review.user.name ?? t("reviewHighlights.anonymous")}
                      </span>
                    </div>
                    <Link
                      href={`/courses/${review.course.slug}`}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {review.course.title}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mobile "more" link at bottom */}
        {hasMore && (
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/reviews">{t("reviewHighlights.moreLink")}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
