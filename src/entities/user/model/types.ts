import type { User } from "@/db/schema";

/**
 * User profile as returned by GET /api/user/profile.
 * Re-exports DB User type directly since all fields are relevant.
 */
export type UserProfile = Pick<
  User,
  "id" | "email" | "name" | "avatarUrl" | "locale" | "createdAt" | "updatedAt"
>;

/**
 * Fields that can be updated via PATCH /api/user/profile.
 */
export interface UpdateProfileData {
  name?: string;
  locale?: string;
}

/**
 * Request body for POST /api/user/password.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Response data for POST /api/user/avatar.
 */
export interface AvatarUploadResponse {
  avatarUrl: string;
}
