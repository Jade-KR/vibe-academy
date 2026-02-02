// Drizzle client
export { db } from "./client";

// Schema (tables, enums, relations)
export {
  // Tables
  users,
  subscriptions,
  payments,
  courses,
  chapters,
  lessons,
  enrollments,
  progress,
  reviews,
  discussions,
  comments,
  coupons,
  // Enums
  subscriptionStatusEnum,
  paymentStatusEnum,
  userRoleEnum,
  courseLevelEnum,
  discountTypeEnum,
  // Relations
  usersRelations,
  subscriptionsRelations,
  paymentsRelations,
  coursesRelations,
  chaptersRelations,
  lessonsRelations,
  enrollmentsRelations,
  progressRelations,
  reviewsRelations,
  discussionsRelations,
  commentsRelations,
  couponsRelations,
} from "./schema";

// Types
export type { User, NewUser, Subscription, NewSubscription, Payment, NewPayment } from "./schema";
export type { Course, NewCourse } from "./schema";
export type { Chapter, NewChapter } from "./schema";
export type { Lesson, NewLesson } from "./schema";
export type { Enrollment, NewEnrollment } from "./schema";
export type { Progress, NewProgress } from "./schema";
export type { Review, NewReview } from "./schema";
export type { Discussion, NewDiscussion } from "./schema";
export type { Comment, NewComment } from "./schema";
export type { Coupon, NewCoupon } from "./schema";
