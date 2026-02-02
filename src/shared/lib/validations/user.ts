import { z } from "zod";
import { passwordSchema } from "./auth";

/**
 * PATCH /api/user/profile
 * At least one field (name or locale) must be provided.
 */
export const updateProfileSchema = z
  .object({
    name: z.string().max(100).optional(),
    locale: z.enum(["ko", "en"]).optional(),
  })
  .refine((data) => data.name !== undefined || data.locale !== undefined, {
    message: "At least one field must be provided",
  });

/**
 * POST /api/user/password
 * Requires current password, new password (with strength rules), and confirmation.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
