import { createServerClient } from "@/shared/api/supabase";
import { successResponse, errorResponse } from "@/shared/lib/api";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResponse("AUTH_ERROR", "Failed to sign out", 500);
    }

    // Session cookies are automatically cleared by Supabase SSR
    return successResponse(null, "Logged out successfully");
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
