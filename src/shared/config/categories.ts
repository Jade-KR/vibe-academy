/**
 * Course category definition for grouping courses by topic.
 */
export interface CourseCategory {
  /** Category key matching the `category` field in the courses DB table */
  key: string;
  /** i18n translation key within the "course" namespace */
  labelKey: string;
}

/**
 * All course categories in display order.
 * Used by landing page, courses listing page, and any future category-based views.
 * Translation keys resolve under `course.categories.*`.
 */
export const COURSE_CATEGORIES: CourseCategory[] = [
  { key: "frontend-basic", labelKey: "categories.frontendBasic" },
  { key: "frontend-advanced", labelKey: "categories.frontendAdvanced" },
  { key: "backend", labelKey: "categories.backend" },
  { key: "developer-essentials", labelKey: "categories.developerEssentials" },
];
