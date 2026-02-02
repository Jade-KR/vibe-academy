import { z } from "zod";

// --- Admin: Courses ---

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  longDescription: z.string().max(10000).optional(),
  price: z.number().int().min(0).default(0),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  category: z.string().max(100).optional(),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional(),
  instructorBio: z.string().max(2000).optional(),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export const updateCourseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(500).optional().nullable(),
    longDescription: z.string().max(10000).optional().nullable(),
    price: z.number().int().min(0).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    category: z.string().max(100).optional().nullable(),
    thumbnailUrl: z.string().url().optional().nullable(),
    previewVideoUrl: z.string().url().optional().nullable(),
    instructorBio: z.string().max(2000).optional().nullable(),
    isPublished: z.boolean().optional(),
    isFree: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// --- Admin: Chapters ---

export const createChapterSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
});

export const updateChapterSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
  })
  .refine((data) => data.title !== undefined, {
    message: "At least one field must be provided",
  });

// --- Admin: Lessons ---

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  isPreview: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

export const updateLessonSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    videoUrl: z.string().url().optional().nullable(),
    duration: z.number().int().min(0).optional().nullable(),
    isPreview: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// --- Admin: Reorder ---

export const reorderSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
      lessons: z
        .array(
          z.object({
            id: z.string().uuid(),
            order: z.number().int().min(0),
          }),
        )
        .optional(),
    }),
  ),
});

// --- Admin: Coupons ---

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with hyphens/underscores"),
    discount: z.number().int().min(1),
    discountType: z.enum(["fixed", "percentage"]),
    courseId: z.string().uuid().optional().nullable(),
    maxUses: z.number().int().min(1).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && data.discount > 100) return false;
      return true;
    },
    { message: "Percentage discount cannot exceed 100" },
  );

// --- Admin: Users Query ---

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["user", "admin"]).optional(),
  search: z.string().optional(),
});

// --- Admin: Analytics Query ---

export const adminAnalyticsQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
});
