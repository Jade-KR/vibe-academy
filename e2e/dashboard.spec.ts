import { test, expect } from "@playwright/test";

/**
 * Dashboard E2E tests.
 *
 * The dashboard is protected by server-side middleware that calls
 * supabase.auth.getUser() -- a direct server-to-Supabase HTTP call
 * that cannot be intercepted by Playwright's page.route().
 *
 * These tests verify the middleware's redirect behavior for
 * unauthenticated users. Authenticated dashboard interactions
 * would require a real Supabase session or test-mode server integration.
 */
test.describe("Dashboard", () => {
  test("should redirect unauthenticated user to login with redirectTo", async ({ page }) => {
    await page.goto("/ko/dashboard");

    // Middleware should redirect to login with redirectTo query param
    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");
  });

  test("should redirect unauthenticated user from settings/profile to login", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/profile");

    // Middleware should redirect to login
    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");
  });

  test("should redirect unauthenticated user from settings/account to login", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/account");

    // Middleware should redirect to login
    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");
  });

  test("should include correct redirectTo path for dashboard", async ({ page }) => {
    await page.goto("/ko/dashboard");

    await page.waitForURL("**/ko/login**", { timeout: 15000 });

    const url = new URL(page.url());
    const redirectTo = url.searchParams.get("redirectTo");
    expect(redirectTo).toBe("/dashboard");
  });

  test("should include correct redirectTo path for settings/profile", async ({ page }) => {
    await page.goto("/ko/dashboard/settings/profile");

    await page.waitForURL("**/ko/login**", { timeout: 15000 });

    const url = new URL(page.url());
    const redirectTo = url.searchParams.get("redirectTo");
    expect(redirectTo).toBe("/dashboard/settings/profile");
  });
});
