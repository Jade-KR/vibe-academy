import { test, expect } from "@playwright/test";

/**
 * Settings E2E tests.
 *
 * The settings pages are protected by server-side middleware that calls
 * supabase.auth.getUser() -- a direct server-to-Supabase HTTP call
 * that cannot be intercepted by Playwright's page.route().
 *
 * These tests verify the middleware's redirect behavior for
 * unauthenticated users accessing settings pages.
 * Authenticated settings interactions (profile update, password change,
 * avatar upload) would require a real Supabase session.
 */
test.describe("Settings", () => {
  test("should redirect unauthenticated user from profile settings to login", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/profile");

    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");

    const url = new URL(page.url());
    const redirectTo = url.searchParams.get("redirectTo");
    expect(redirectTo).toBe("/dashboard/settings/profile");
  });

  test("should redirect unauthenticated user from account settings to login", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/account");

    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");

    const url = new URL(page.url());
    const redirectTo = url.searchParams.get("redirectTo");
    expect(redirectTo).toBe("/dashboard/settings/account");
  });

  test("should show login page with correct form after redirect from profile", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/profile");

    // Wait for redirect to login
    await page.waitForURL("**/ko/login**", { timeout: 15000 });

    // Verify login form is displayed with accessible elements
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("should show login page with correct form after redirect from account", async ({
    page,
  }) => {
    await page.goto("/ko/dashboard/settings/account");

    // Wait for redirect to login
    await page.waitForURL("**/ko/login**", { timeout: 15000 });

    // Verify login form is displayed with accessible elements
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });
});
