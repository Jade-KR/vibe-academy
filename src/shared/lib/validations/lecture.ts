import { z } from "zod";

// --- Checkout ---

/** POST /api/checkout/[courseSlug] */
export const courseCheckoutSchema = z.object({
  couponCode: z.string().optional(),
});

// --- Progress ---

/** PATCH /api/progress/[lessonId] */
export const progressUpdateSchema = z
  .object({
    completed: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine((data) => data.completed !== undefined || data.position !== undefined, {
    message: "At least one of 'completed' or 'position' must be provided",
  });

// --- Discussions ---

/** POST /api/lessons/[lessonId]/discussions */
export const createDiscussionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be 5000 characters or less"),
});

/** PATCH /api/discussions/[discussionId] */
export const updateDiscussionSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or less")
      .optional(),
    content: z
      .string()
      .min(1, "Content is required")
      .max(5000, "Content must be 5000 characters or less")
      .optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one of 'title' or 'content' must be provided",
  });

// --- Comments ---

/** POST /api/discussions/[discussionId]/comments */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less"),
});

/** PATCH /api/comments/[commentId] */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less"),
});

// --- Reviews ---

/** POST /api/reviews (create) */
export const createReviewSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().max(200, "Title must be 200 characters or less").optional(),
  content: z
    .string()
    .min(20, "Review must be at least 20 characters")
    .max(1000, "Review must be 1000 characters or less"),
});

/** PATCH /api/reviews/[id] */
export const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5").optional(),
    title: z.string().max(200, "Title must be 200 characters or less").optional(),
    content: z
      .string()
      .min(20, "Review must be at least 20 characters")
      .max(1000, "Review must be 1000 characters or less")
      .optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.title !== undefined || data.content !== undefined,
    {
      message: "At least one of 'rating', 'title', or 'content' must be provided",
    },
  );

// --- Pagination (reusable for discussions) ---

/** GET /api/lessons/[lessonId]/discussions */
export const discussionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
