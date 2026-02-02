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
  const { featuredCourses, coursesByCategory, isLoading: coursesLoading } = useLandingCourses();
  const {
    reviews,
    hasMore: reviewsHasMore,
    isLoading: reviewsLoading,
  } = useGlobalReviews(REVIEW_HIGHLIGHTS_COUNT);

  return (
    <>
      <HeroSection />
      <FeaturedCoursesCarousel courses={featuredCourses} isLoading={coursesLoading} />
      <ValuePropositionSection />
      <CategoryCoursesSection coursesByCategory={coursesByCategory} isLoading={coursesLoading} />
      <ReviewHighlightsSection
        reviews={reviews}
        isLoading={reviewsLoading}
        hasMore={reviewsHasMore}
      />
    </>
  );
}
