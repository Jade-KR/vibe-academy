import { z } from "zod";

/**
 * Query params for GET /api/courses
 */
export const courseListQuerySchema = z.object({
  category: z.string().optional(),
});

/**
 * Query params for GET /api/courses/[slug]/reviews and GET /api/reviews
 */
export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
