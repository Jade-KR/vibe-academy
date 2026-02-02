import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/shared/api/supabase";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { siteConfig } from "@/shared/config/site";

const DEFAULT_LOCALE = "ko";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorRedirectUrl = `${siteConfig.url}/${DEFAULT_LOCALE}/auth/login`;

  // 1. Validate code param
  if (!code) {
    console.error("[GET /api/auth/callback] Missing code parameter");
    return NextResponse.redirect(`${errorRedirectUrl}?error=missing_code`);
  }

  try {
    // 2. Exchange code for session
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("[GET /api/auth/callback] Code exchange failed:", error?.message);
      return NextResponse.redirect(`${errorRedirectUrl}?error=auth_failed`);
    }

    const authUser = data.user;
    const metadata = authUser.user_metadata ?? {};
    const name = metadata.full_name ?? metadata.name ?? null;
    const avatarUrl = metadata.avatar_url ?? null;
    let locale = DEFAULT_LOCALE;

    // 3. Upsert DB user (non-fatal on failure)
    try {
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.supabaseUserId, authUser.id));

      if (existingUsers.length > 0) {
        // Update existing user metadata
        const [updated] = await db
          .update(users)
          .set({
            name: name ?? existingUsers[0].name,
            avatarUrl: avatarUrl ?? existingUsers[0].avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.supabaseUserId, authUser.id))
          .returning();
        locale = updated?.locale ?? DEFAULT_LOCALE;
      } else {
        // Create new DB user
        const email = authUser.email ?? "";
        if (!email) {
          console.warn("[GET /api/auth/callback] OAuth user has no email, skipping DB insert");
        }
        const [newUser] = await db
          .insert(users)
          .values({
            supabaseUserId: authUser.id,
            email,
            name,
            avatarUrl,
          })
          .returning();
        locale = newUser?.locale ?? DEFAULT_LOCALE;
      }
    } catch (dbError) {
      // DB failure is non-fatal: auth session was established successfully.
      // User can still access the app; profile will be created on next request.
      console.error("[GET /api/auth/callback] DB upsert failed:", dbError);
    }

    // 4. Redirect to dashboard
    return NextResponse.redirect(`${siteConfig.url}/${locale}/dashboard`);
  } catch (err) {
    console.error("[GET /api/auth/callback]", err);
    return NextResponse.redirect(`${errorRedirectUrl}?error=unexpected`);
  }
}
