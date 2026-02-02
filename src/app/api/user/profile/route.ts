import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { updateProfileSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";

/** Fields returned in profile responses (excludes supabaseUserId, updatedAt). */
const profileColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  avatarUrl: users.avatarUrl,
  locale: users.locale,
  createdAt: users.createdAt,
} as const;

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const [dbUser] = await db
      .select(profileColumns)
      .from(users)
      .where(eq(users.supabaseUserId, user.id));

    if (!dbUser) return errorResponse("NOT_FOUND", "User profile not found", 404);

    return successResponse(dbUser);
  } catch (error) {
    console.error("[GET /api/user/profile]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const [updated] = await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.supabaseUserId, user.id))
      .returning(profileColumns);

    if (!updated) return errorResponse("NOT_FOUND", "User profile not found", 404);

    return successResponse(updated, "Profile updated successfully");
  } catch (error) {
    console.error("[PATCH /api/user/profile]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
