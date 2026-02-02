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
 * Landing page category definition for the category courses section.
 */
export interface LandingCategory {
  key: string;
  labelKey: string;
}
