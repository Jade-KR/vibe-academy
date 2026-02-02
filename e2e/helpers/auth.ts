import { type Page } from "@playwright/test";
import { TEST_USER, successResponse } from "./mock-data";

/**
 * Mock all API routes to simulate an authenticated user.
 * This intercepts client-side fetch calls.
 *
 * NOTE: This does NOT bypass server-side middleware auth checks.
 * For middleware-protected routes (dashboard, settings), the middleware
 * calls supabase.auth.getUser() on the server side, which makes a
 * direct HTTP call to Supabase -- not interceptable by page.route().
 * Protected route tests should focus on verifying the redirect behavior.
 */
export async function mockAuthenticatedState(page: Page) {
  // Mock profile API
  await page.route("**/api/user/profile", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(successResponse(TEST_USER)),
      });
    }
    return route.continue();
  });

  // Mock Supabase auth endpoints (browser client calls)
  // Single handler for all token grant types to avoid overlapping patterns
  await page.route("**/auth/v1/token?grant_type=**", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: TEST_USER.id,
          email: TEST_USER.email,
          email_confirmed_at: "2025-01-01T00:00:00.000Z",
          app_metadata: {},
          user_metadata: { name: TEST_USER.name },
          aud: "authenticated",
          created_at: TEST_USER.createdAt,
        },
      }),
    });
  });

  // Mock Supabase getUser (browser)
  await page.route("**/auth/v1/user", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: TEST_USER.id,
        email: TEST_USER.email,
        email_confirmed_at: "2025-01-01T00:00:00.000Z",
        app_metadata: {},
        user_metadata: { name: TEST_USER.name },
        aud: "authenticated",
        created_at: TEST_USER.createdAt,
      }),
    });
  });
}

/**
 * Mock unauthenticated state - ensure no session exists.
 */
export async function mockUnauthenticatedState(page: Page) {
  // Mock Supabase session endpoints to return no user
  await page.route("**/auth/v1/user", (route) => {
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "No session" }),
    });
  });

  await page.route("**/auth/v1/token?grant_type=**", (route) => {
    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "invalid_grant" }),
    });
  });
}
