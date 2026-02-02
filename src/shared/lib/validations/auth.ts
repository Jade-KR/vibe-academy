import { z } from "zod";
import { authConfig } from "@/shared/config/auth";

/**
 * Reusable password schema derived from authConfig.password rules.
 * Enforces: min length, uppercase, lowercase, number, special character.
 */
const { minLength } = authConfig.password;
export const passwordSchema = z
  .string()
  .min(minLength, `Password must be at least ${minLength} characters`)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const emailSchema = z.string().email("Invalid email address");

/**
 * POST /api/auth/register
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * POST /api/auth/reset-password
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Social provider validation.
 * GET /api/auth/social/[provider]
 */
export const socialProviderSchema = z.enum(authConfig.providers);



