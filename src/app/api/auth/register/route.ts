import { NextRequest } from "next/server";
import { createAdminClient, createServerClient } from "@/shared/api/supabase";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { registerSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { sendEmail } from "@/shared/api/resend";
import { WelcomeEmail } from "@/shared/api/resend/templates/welcome";
import { siteConfig } from "@/shared/config/site";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email, password, name } = parsed.data;

    // 2. Create Supabase Auth user
    const supabase = await createServerClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return errorResponse("EMAIL_EXISTS", "Email already registered", 409);
      }
      return errorResponse("AUTH_ERROR", authError.message, 400);
    }

    if (!authData.user) {
      return errorResponse("AUTH_ERROR", "Failed to create user", 500);
    }

    // 3. Create DB profile — rollback Supabase Auth user on failure
    let dbUser;
    try {
      [dbUser] = await db
        .insert(users)
        .values({
          supabaseUserId: authData.user.id,
          email,
          name: name ?? null,
        })
        .returning();
    } catch (dbError) {
      console.error("[POST /api/auth/register] DB insert failed, rolling back auth user", dbError);
      try {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("[POST /api/auth/register] Failed to clean up auth user", cleanupError);
      }
      return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
    }

    // 4. Send welcome email (fire-and-forget)
    sendEmail({
      to: dbUser.email,
      subject: `Welcome to ${siteConfig.name}!`,
      react: WelcomeEmail({
        name: dbUser.name ?? undefined,
        loginUrl: `${siteConfig.url}/login`,
      }),
    }).catch((err) => {
      console.error("[POST /api/auth/register] Failed to send welcome email", err);
    });

    // 5. Return success
    return successResponse(
      {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        },
      },
      "Registration successful. Please check your email to verify your account.",
      201,
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
