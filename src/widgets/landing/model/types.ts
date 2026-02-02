import type { CourseLevel } from "@/entities/course";

/**
 * Course summary with computed review stats.
 * Matches the shape returned by GET /api/courses (which includes reviewCount
 * and averageRating via SQL subquery, beyond what CourseSummary defines).
 */
export interface CourseSummaryWithStats {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  level: CourseLevel;
  category: string | null;
  thumbnailUrl: string | null;
  isFree: boolean;
  reviewCount: number;
  averageRating: number;
}

/**
 * Individual review item from the global reviews endpoint.
 * Shape matches GET /api/reviews response items.
 */
export interface GlobalReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
  course: {
    title: string;
    slug: string;
  };
}

/**
 * Landing page category definition for the category courses section.
 */
export interface LandingCategory {
  key: string;
  labelKey: string;
}
