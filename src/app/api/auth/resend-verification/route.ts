import { NextRequest } from "next/server";
import { createServerClient } from "@/shared/api/supabase";
import { forgotPasswordSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { createRateLimiter } from "@/shared/lib/rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const resendVerificationRateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: FIFTEEN_MINUTES_MS,
});

// Generic success message to prevent email enumeration
const SUCCESS_MESSAGE = "If an account with that email exists, a verification email has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    // Reuse forgotPasswordSchema since it's just { email }
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    if (resendVerificationRateLimiter.isLimited(normalizedEmail)) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please try again later.", 429);
    }

    const supabase = await createServerClient();
    await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    return successResponse(null, SUCCESS_MESSAGE);
  } catch (error) {
    console.error("[POST /api/auth/resend-verification]", error);
    return successResponse(null, SUCCESS_MESSAGE);
  }
}
