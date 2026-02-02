export {
  emailSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  socialProviderSchema,
  magicLinkSchema,
  otpSendSchema,
  otpVerifySchema,
} from "./auth";

export { updateProfileSchema, changePasswordSchema } from "./user";

export { checkoutSchema, subscriptionActionSchema } from "./payment";

export { courseListQuerySchema, reviewListQuerySchema } from "./course";

export {
  courseCheckoutSchema,
  progressUpdateSchema,
  createDiscussionSchema,
  updateDiscussionSchema,
  createCommentSchema,
  updateCommentSchema,
  createReviewSchema,
  updateReviewSchema,
  discussionListQuerySchema,
} from "./lecture";

export {
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderSchema,
  createCouponSchema,
  couponListQuerySchema,
  adminUserListQuerySchema,
  adminAnalyticsQuerySchema,
  uploadUrlSchema,
} from "./admin";
