import { COURSE_CATEGORIES } from "@/shared/config/categories";
import type { CourseCategory } from "@/shared/config/categories";

/** @deprecated Use COURSE_CATEGORIES from @/shared/config instead */
export const LANDING_CATEGORIES = COURSE_CATEGORIES;
export type LandingCategory = CourseCategory;

/** Number of featured courses in the carousel */
export const FEATURED_COURSES_COUNT = 7;

/** Number of reviews to show in the highlights section */
export const REVIEW_HIGHLIGHTS_COUNT = 6;
