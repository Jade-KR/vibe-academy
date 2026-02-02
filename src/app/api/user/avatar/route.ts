import { NextRequest } from "next/server";
import sharp from "sharp";
import { uploadAvatar, deleteAvatar } from "@/shared/api/supabase";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const AVATAR_DIMENSION = 256;

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return errorResponse("VALIDATION_ERROR", "No file provided", 400);
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("VALIDATION_ERROR", "File must be JPG, PNG, or WebP", 400);
    }
    if (file.size > MAX_SIZE) {
      return errorResponse("VALIDATION_ERROR", "File must be 5MB or less", 400);
    }

    // Resize to 256x256 before upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(AVATAR_DIMENSION, AVATAR_DIMENSION, { fit: "cover" })
      .toBuffer();

    const ext = EXT_MAP[file.type];
    const publicUrl = await uploadAvatar(resized, user.id, {
      contentType: file.type,
      ext,
      server: true,
    });

    // Update DB with new avatar URL
    await db
      .update(users)
      .set({ avatarUrl: publicUrl, updatedAt: new Date() })
      .where(eq(users.supabaseUserId, user.id));

    return successResponse({ avatarUrl: publicUrl }, "Avatar uploaded successfully");
  } catch (error) {
    console.error("[POST /api/user/avatar]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    await deleteAvatar(user.id, { server: true });

    // Clear avatar URL in DB
    await db
      .update(users)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(users.supabaseUserId, user.id));

    return successResponse(null, "Avatar deleted successfully");
  } catch (error) {
    console.error("[DELETE /api/user/avatar]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
