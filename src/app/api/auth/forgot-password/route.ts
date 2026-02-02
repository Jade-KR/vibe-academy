import { NextRequest } from "next/server";
import { createServerClient } from "@/shared/api/supabase";
import { authConfig } from "@/shared/config/auth";
import { forgotPasswordSchema } from "@/shared/lib/validations";
import { successResponse, zodErrorResponse } from "@/shared/lib/api";
import { createRateLimiter } from "@/shared/lib/rate-limit";

const HOUR_MS = 60 * 60 * 1000;
const forgotPasswordRateLimiter = createRateLimiter({
  maxAttempts: authConfig.forgotPassword.rateLimitPerHour,
  windowMs: HOUR_MS,
});

// Generic success message to prevent email enumeration
const SUCCESS_MESSAGE = "If an account with that email exists, a reset link has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limit check
    if (forgotPasswordRateLimiter.isLimited(normalizedEmail)) {
      console.warn(`[forgot-password] Rate limit exceeded for ${normalizedEmail}`);
      // Still return 200 to prevent email enumeration
      return successResponse(null, SUCCESS_MESSAGE);
    }

    // Send reset email via Supabase
    const supabase = await createServerClient();
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    // Always return success to prevent email enumeration
    return successResponse(null, SUCCESS_MESSAGE);
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    // Still return success to prevent enumeration
    return successResponse(null, SUCCESS_MESSAGE);
  }
}
