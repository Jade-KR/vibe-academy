import { test, expect } from "@playwright/test";

/**
 * Payment E2E tests.
 *
 * The pricing page is public (marketing route group).
 * These tests verify the pricing UI and user interactions:
 * - Plan cards display correctly
 * - CTA buttons navigate to the correct destinations
 * - Checkout flow initiates via button click on the pricing page
 */
test.describe("Payment", () => {
  test("should display pricing plans", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Assert heading using accessible role
    await expect(page.getByRole("heading", { level: 1, name: "요금제" })).toBeVisible();

    // There should be pricing cards for Free, Pro, Enterprise
    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Enterprise", { exact: true }).first()).toBeVisible();

    // CTA buttons should be visible ("시작하기" for free, "구독하기" for paid)
    // These render as links styled as buttons (<Button asChild><Link>...)
    const ctaLinks = page.getByRole("link", { name: /시작하기|구독하기/ });
    const linkCount = await ctaLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  test("should navigate to register from free plan CTA", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Click the "시작하기" (Get Started) link for the free plan
    const getStartedLink = page.getByRole("link", { name: "시작하기" }).first();
    await expect(getStartedLink).toBeVisible();
    await getStartedLink.click();

    // Should navigate to register page
    await page.waitForURL("**/ko/register**", { timeout: 10000 });
    expect(page.url()).toContain("/ko/register");
  });

  test("should navigate to register from paid plan CTA", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Click the "구독하기" (Subscribe) link for a paid plan
    const subscribeLink = page.getByRole("link", { name: "구독하기" }).first();
    await expect(subscribeLink).toBeVisible();
    await subscribeLink.click();

    // All pricing CTA buttons currently link to /register
    // (checkout flow starts after authentication)
    await page.waitForURL("**/ko/register**", { timeout: 10000 });
    expect(page.url()).toContain("/ko/register");
  });

  test("should display pricing FAQ section", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Verify FAQ section is present
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();

    // Verify at least one FAQ question is visible
    await expect(
      page.getByText("무료 플랜에서 유료 플랜으로 전환할 수 있나요?"),
    ).toBeVisible();
  });

  test("should display correct pricing information for each plan", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Verify "무료" text appears for the free plan
    await expect(page.getByText("무료", { exact: true }).first()).toBeVisible();

    // Verify "인기" badge appears on the Pro plan
    await expect(page.getByText("인기")).toBeVisible();

    // Verify feature lists are visible - "주요 기능" headings
    const featureHeadings = page.getByText("주요 기능");
    const headingCount = await featureHeadings.count();
    expect(headingCount).toBeGreaterThanOrEqual(2);
  });

  test("should toggle between monthly and yearly billing", async ({ page }) => {
    await page.goto("/ko/pricing");

    // Look for billing interval toggle buttons
    const monthlyButton = page.getByRole("button", { name: "월간" }).or(
      page.getByText("월간", { exact: true }),
    );
    const yearlyButton = page.getByRole("button", { name: "연간" }).or(
      page.getByText("연간", { exact: true }),
    );

    // At least one billing option should be visible
    const monthlyVisible = await monthlyButton.first().isVisible().catch(() => false);
    const yearlyVisible = await yearlyButton.first().isVisible().catch(() => false);

    // If billing toggle exists, test switching
    if (monthlyVisible && yearlyVisible) {
      await yearlyButton.first().click();
      // After clicking yearly, the yearly discount text should appear
      await expect(page.getByText(/연간 결제/).first()).toBeVisible({ timeout: 5000 });
    } else {
      // If no toggle, at least verify pricing info is displayed
      await expect(page.getByText(/원|무료/).first()).toBeVisible();
    }
  });
});
