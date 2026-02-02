import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/shared/api/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/learn", "/admin"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  // Step 1: Run next-intl middleware for locale routing
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect (e.g., / -> /ko/), return it immediately
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // Step 2: Run Supabase session refresh
  const { supabaseResponse, user } = await updateSession(request);

  // Copy next-intl headers/cookies onto the Supabase response
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  // Step 3: Route protection with locale-stripped pathname
  const strippedPathname = stripLocalePrefix(request.nextUrl.pathname);

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => strippedPathname === route || strippedPathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    // Redirect preserves locale prefix
    const locale = request.nextUrl.pathname.split("/")[1];
    url.pathname = `/${locale}/login`;
    url.searchParams.set("redirectTo", strippedPathname);
    return NextResponse.redirect(url);
  }

  // Redirect unverified-email users away from protected routes to verify-email
  const emailNotConfirmed = user && !user.email_confirmed_at;

  if (isProtectedRoute && emailNotConfirmed) {
    const url = request.nextUrl.clone();
    const locale = request.nextUrl.pathname.split("/")[1];
    url.pathname = `/${locale}/verify-email`;
    return NextResponse.redirect(url);
  }

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => strippedPathname === route || strippedPathname.startsWith(`${route}/`),
  );

  const isVerifyEmailRoute =
    strippedPathname === "/verify-email" || strippedPathname.startsWith("/verify-email/");

  // Allow unverified-email users to stay on verify-email page
  if (isAuthRoute && user) {
    if (isVerifyEmailRoute && emailNotConfirmed) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    const locale = request.nextUrl.pathname.split("/")[1];
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
