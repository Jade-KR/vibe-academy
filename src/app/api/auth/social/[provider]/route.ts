import { NextRequest, NextResponse } from "next/server";
import type { Provider } from "@supabase/supabase-js";
import { createServerClient } from "@/shared/api/supabase";
import { siteConfig } from "@/shared/config/site";
import { socialProviderSchema } from "@/shared/lib/validations";
import { errorResponse } from "@/shared/lib/api";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. Validate provider
    const { provider: rawProvider } = await context.params;
    const parsed = socialProviderSchema.safeParse(rawProvider);
    if (!parsed.success) {
      return errorResponse("INVALID_PROVIDER", `Unsupported provider: ${rawProvider}`, 400);
    }
    const provider = parsed.data;

    // 2. Initiate OAuth via Supabase
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${siteConfig.url}/api/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error("[GET /api/auth/social/[provider]]", error?.message ?? "No OAuth URL returned");
      return errorResponse("OAUTH_ERROR", "Failed to initiate OAuth flow", 500);
    }

    // 3. Redirect to provider
    return NextResponse.redirect(data.url);
  } catch (err) {
    console.error("[GET /api/auth/social/[provider]]", err);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
