import type { LandingCategory } from "../model/types";

/** Number of featured courses in the carousel */
export const FEATURED_COURSES_COUNT = 7;

/** Number of reviews to show in the highlights section */
export const REVIEW_HIGHLIGHTS_COUNT = 6;

/** Categories to display on the landing page, in order */
export const LANDING_CATEGORIES: LandingCategory[] = [
  { key: "frontend-basic", labelKey: "landing.categories.frontendBasic" },
  { key: "frontend-advanced", labelKey: "landing.categories.frontendAdvanced" },
  { key: "backend", labelKey: "landing.categories.backend" },
  { key: "developer-essentials", labelKey: "landing.categories.developerEssentials" },
];
