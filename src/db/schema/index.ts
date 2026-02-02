import { relations } from "drizzle-orm";

// Re-export enums
export {
  subscriptionStatusEnum,
  paymentStatusEnum,
  userRoleEnum,
  courseLevelEnum,
  discountTypeEnum,
} from "./enums";

// Re-export tables
export { users } from "./users";
export { subscriptions } from "./subscriptions";
export { payments } from "./payments";
export { courses } from "./courses";
export { chapters } from "./chapters";
export { lessons } from "./lessons";
export { enrollments } from "./enrollments";
export { progress } from "./progress";
export { reviews } from "./reviews";
export { discussions } from "./discussions";
export { comments } from "./comments";
export { coupons } from "./coupons";

// Re-export types
export type { User, NewUser } from "./users";
export type { Subscription, NewSubscription } from "./subscriptions";
export type { Payment, NewPayment } from "./payments";
export type { Course, NewCourse } from "./courses";
export type { Chapter, NewChapter } from "./chapters";
export type { Lesson, NewLesson } from "./lessons";
export type { Enrollment, NewEnrollment } from "./enrollments";
export type { Progress, NewProgress } from "./progress";
export type { Review, NewReview } from "./reviews";
export type { Discussion, NewDiscussion } from "./discussions";
export type { Comment, NewComment } from "./comments";
export type { Coupon, NewCoupon } from "./coupons";

// --- Relations (defined here to avoid circular imports) ---

import { users } from "./users";
import { subscriptions } from "./subscriptions";
import { payments } from "./payments";
import { courses } from "./courses";
import { chapters } from "./chapters";
import { lessons } from "./lessons";
import { enrollments } from "./enrollments";
import { progress } from "./progress";
import { reviews } from "./reviews";
import { discussions } from "./discussions";
import { comments } from "./comments";
import { coupons } from "./coupons";

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
  enrollments: many(enrollments),
  progress: many(progress),
  reviews: many(reviews),
  discussions: many(discussions),
  comments: many(comments),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  chapters: many(chapters),
  enrollments: many(enrollments),
  reviews: many(reviews),
  coupons: many(coupons),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [lessons.chapterId],
    references: [chapters.id],
  }),
  progress: many(progress),
  discussions: many(discussions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [progress.lessonId],
    references: [lessons.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [reviews.courseId],
    references: [courses.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [discussions.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [discussions.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  discussion: one(discussions, {
    fields: [comments.discussionId],
    references: [discussions.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  course: one(courses, {
    fields: [coupons.courseId],
    references: [courses.id],
  }),
}));
