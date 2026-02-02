import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { changePasswordSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";
import { createRateLimiter } from "@/shared/lib/rate-limit";

/** Rate limiter: 5 password change attempts per 15 minutes per user. */
const passwordRateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const body: unknown = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { currentPassword, newPassword } = parsed.data;

    // Rate limit by user ID
    if (passwordRateLimiter.isLimited(user.id)) {
      return errorResponse("RATE_LIMITED", "Too many attempts. Please try again later.", 429);
    }

    // Get user email from DB (needed for signInWithPassword verification)
    const [dbUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.supabaseUserId, user.id));

    if (!dbUser) return errorResponse("NOT_FOUND", "User not found", 404);

    // Verify current password by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: dbUser.email,
      password: currentPassword,
    });

    if (signInError) {
      return errorResponse("INVALID_PASSWORD", "Current password is incorrect", 400);
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return errorResponse("AUTH_ERROR", updateError.message, 400);
    }

    return successResponse(null, "Password changed successfully");
  } catch (error) {
    console.error("[POST /api/user/password]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
