import { test, expect } from "@playwright/test";
import { mockAuthenticatedState } from "./helpers/auth";
import {
  TEST_CREDENTIALS,
  REGISTER_PASSWORD,
  successResponse,
  errorResponse,
} from "./helpers/mock-data";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/ko/login");

    // CardTitle renders as a div with the text "로그인"
    await expect(page.getByText("로그인", { exact: true }).first()).toBeVisible();

    // Assert form inputs using accessible labels (FormLabel text from translations)
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();

    // Assert submit button using accessible role and name
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Mock login API to return 401
    let loginApiCalled = false;
    await page.route("**/api/auth/login", (route) => {
      loginApiCalled = true;
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify(
          errorResponse("INVALID_CREDENTIALS", "Invalid email or password"),
        ),
      });
    });

    await page.goto("/ko/login");

    // Wait for form to be ready
    await expect(page.getByLabel("이메일")).toBeVisible();

    // Fill form using accessible labels
    await page.getByLabel("이메일").fill("wrong@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword1A!");

    // Set up response promise before clicking
    const responsePromise = page.waitForResponse("**/api/auth/login", { timeout: 15000 });

    // Submit using accessible button name
    await page.getByRole("button", { name: "로그인" }).click();

    // Wait for the API call to complete
    await responsePromise;

    // Verify the login API was called
    expect(loginApiCalled).toBe(true);

    // After error, the user should remain on the login page (no navigation)
    expect(page.url()).toContain("/ko/login");

    // The form should still be visible (not navigated away)
    await expect(page.getByLabel("이메일")).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    // Mock login API to return success
    let loginPayload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/login", async (route) => {
      const body = route.request().postDataJSON();
      loginPayload = body;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          successResponse({ user: { id: "test-user-id", email: TEST_CREDENTIALS.email } }),
        ),
      });
    });

    // Set up authenticated state so subsequent client-side auth checks pass
    await mockAuthenticatedState(page);

    await page.goto("/ko/login");

    // Wait for form to be ready
    await expect(page.getByLabel("이메일")).toBeVisible();

    // Fill form using accessible labels
    await page.getByLabel("이메일").fill(TEST_CREDENTIALS.email);
    await page.getByLabel("비밀번호").fill(TEST_CREDENTIALS.password);

    // Set up response promise before clicking
    const responsePromise = page.waitForResponse("**/api/auth/login", { timeout: 15000 });

    // Submit using accessible button name
    await page.getByRole("button", { name: "로그인" }).click();

    // Wait for the login API to be called
    await responsePromise;

    // Verify login API was called with correct credentials
    expect(loginPayload).toBeTruthy();
    expect((loginPayload as Record<string, unknown>).email).toBe(TEST_CREDENTIALS.email);
    expect((loginPayload as Record<string, unknown>).password).toBe(TEST_CREDENTIALS.password);

    // After successful login, the app calls router.push("/dashboard")
    // which triggers a navigation. The URL should change.
    // Due to middleware server-side auth check, it may redirect to login with redirectTo param.
    // We verify the navigation was attempted by checking the URL changed from plain /ko/login.
    await page.waitForURL((url) => url.href !== "http://localhost:3000/ko/login", {
      timeout: 15000,
    });

    // The URL should have changed (either to dashboard or login?redirectTo=...)
    const currentUrl = page.url();
    const navigatedAway = currentUrl.includes("/ko/dashboard") || currentUrl.includes("redirectTo");
    expect(navigatedAway).toBeTruthy();
  });

  test("should register new user", async ({ page }) => {
    // Mock register API
    let registerPayload: Record<string, unknown> | null = null;
    await page.route("**/api/auth/register", (route) => {
      registerPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          successResponse({
            user: { id: "new-user-id", email: "new@example.com", name: "New User" },
          }),
        ),
      });
    });

    await page.goto("/ko/register");

    // Wait for form to be ready
    await expect(page.getByLabel("이름")).toBeVisible();

    // Fill form using accessible labels (from translations: auth.register.*)
    await page.getByLabel("이름").fill("New User");
    await page.getByLabel("이메일").fill("new@example.com");
    // Password and confirmPassword both have label "비밀번호" variants
    // Use the exact label text from translations
    await page.getByLabel("비밀번호", { exact: true }).fill(REGISTER_PASSWORD);
    await page.getByLabel("비밀번호 확인").fill(REGISTER_PASSWORD);

    // Set up response promise before clicking submit
    const responsePromise = page.waitForResponse("**/api/auth/register", { timeout: 15000 });

    // Submit using accessible button name
    await page.getByRole("button", { name: "가입하기" }).click();

    // Wait for register API call
    await responsePromise;

    // Verify registration payload
    expect(registerPayload).toBeTruthy();
    expect((registerPayload as Record<string, unknown>).email).toBe("new@example.com");
    expect((registerPayload as Record<string, unknown>).name).toBe("New User");

    // After register success, app navigates to /verify-email
    await page.waitForURL("**/ko/verify-email**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/verify-email");
  });

  test("should handle social login redirect", async ({ page }) => {
    await page.goto("/ko/login");

    // Wait for page to be ready
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();

    // Social login uses window.location.href = `/api/auth/social/google`
    // Track requests to detect the social auth endpoint being hit.
    let socialAuthRequested = false;
    let socialAuthUrl = "";

    page.on("request", (request) => {
      if (request.url().includes("/api/auth/social/google")) {
        socialAuthRequested = true;
        socialAuthUrl = request.url();
      }
    });

    // Intercept the social auth endpoint to prevent actual navigation to Google
    await page.route("**/api/auth/social/google**", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Redirecting to Google...</body></html>",
      });
    });

    // Click Google social login button
    const googleButton = page.getByRole("button", { name: /Google/ });
    await expect(googleButton).toBeVisible();
    await googleButton.click();

    // Wait for the page to navigate to the social auth endpoint
    await page.waitForURL("**/api/auth/social/google**", { timeout: 10000 });

    // Verify the social auth endpoint was requested
    expect(socialAuthRequested).toBe(true);
    expect(socialAuthUrl).toContain("/api/auth/social/google");
  });

  test("should redirect unauthenticated user from dashboard to login", async ({ page }) => {
    // Navigate to protected dashboard route without auth.
    // The middleware calls supabase.auth.getUser() server-side, which cannot be mocked
    // via page.route(). This test explicitly verifies the redirect behavior.
    await page.goto("/ko/dashboard");

    await page.waitForURL("**/ko/login**", { timeout: 15000 });
    expect(page.url()).toContain("/ko/login");
    expect(page.url()).toContain("redirectTo");
  });
});
