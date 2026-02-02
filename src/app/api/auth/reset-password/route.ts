import { NextRequest } from "next/server";
import { createServerClient } from "@/shared/api/supabase";
import { resetPasswordSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { password } = parsed.data;

    // Supabase reset flow: the user clicks a reset link that sets a session
    // via the auth callback. This endpoint is called while the user has
    // that valid session active.
    const supabase = await createServerClient();

    // Verify the user is authenticated (has valid reset session)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse(
        "INVALID_TOKEN",
        "Invalid or expired reset token. Please request a new password reset.",
        401,
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return errorResponse("AUTH_ERROR", updateError.message, 400);
    }

    return successResponse(null, "Password updated successfully. You can now log in.");
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
