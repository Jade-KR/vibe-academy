"use client";

import { HeroSection } from "./hero-section";
import { FeaturedCoursesCarousel } from "./featured-courses-carousel";
import { ValuePropositionSection } from "./value-proposition-section";
import { CategoryCoursesSection } from "./category-courses-section";
import { ReviewHighlightsSection } from "./review-highlights-section";
import { useLandingCourses } from "../api/use-landing-courses";
import { useGlobalReviews } from "@/entities/review";
import { REVIEW_HIGHLIGHTS_COUNT } from "../config";

export function LandingContent() {
  const {
    featuredCourses,
    coursesByCategory,
    error: coursesError,
    isLoading: coursesLoading,
  } = useLandingCourses();
  const {
    reviews,
    hasMore: reviewsHasMore,
    error: reviewsError,
    isLoading: reviewsLoading,
  } = useGlobalReviews(REVIEW_HIGHLIGHTS_COUNT);

  const showCourses = coursesLoading || (!coursesError && featuredCourses.length > 0);
  const showReviews = reviewsLoading || (!reviewsError && reviews.length > 0);

  return (
    <>
      <HeroSection />
      {showCourses && (
        <FeaturedCoursesCarousel courses={featuredCourses} isLoading={coursesLoading} />
      )}
      <ValuePropositionSection />
      {showCourses && (
        <CategoryCoursesSection coursesByCategory={coursesByCategory} isLoading={coursesLoading} />
      )}
      {showReviews && (
        <ReviewHighlightsSection
          reviews={reviews}
          isLoading={reviewsLoading}
          hasMore={reviewsHasMore}
        />
      )}
    </>
  );
}
