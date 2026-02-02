import { NextRequest } from "next/server";
import { createServerClient } from "@/shared/api/supabase";
import { loginSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { createRateLimiter } from "@/shared/lib/rate-limit";

// Rate limiter: 10 attempts per 15 minutes per email
const loginRateLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limit check
    if (loginRateLimiter.isLimited(normalizedEmail)) {
      return errorResponse("RATE_LIMITED", "Too many login attempts. Please try again later.", 429);
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    // Session cookies are automatically set by Supabase SSR via setAll.
    // Do NOT return tokens in the response body — session is managed via httpOnly cookies.
    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
