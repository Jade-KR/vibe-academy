import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/shared/api/resend/templates/welcome";
import { MagicLinkEmail } from "@/shared/api/resend/templates/magic-link";
import { OtpEmail } from "@/shared/api/resend/templates/otp";
import { ResetPasswordEmail } from "@/shared/api/resend/templates/reset-password";
import { SubscriptionEmail } from "@/shared/api/resend/templates/subscription";

describe("Email templates", () => {
  describe("WelcomeEmail", () => {
    it("renders without errors", async () => {
      const html = await render(
        WelcomeEmail({ name: "Jade", loginUrl: "https://example.com/login" }),
      );
      expect(html).toBeTruthy();
      expect(typeof html).toBe("string");
    });

    it("contains the user name when provided", async () => {
      const html = await render(
        WelcomeEmail({ name: "Jade", loginUrl: "https://example.com/login" }),
      );
      expect(html).toContain("Jade");
    });

    it("contains login URL", async () => {
      const html = await render(
        WelcomeEmail({ name: "Jade", loginUrl: "https://example.com/login" }),
      );
      expect(html).toContain("https://example.com/login");
    });

    it("renders without name (fallback greeting)", async () => {
      const html = await render(WelcomeEmail({ loginUrl: "https://example.com/login" }));
      expect(html).toBeTruthy();
      expect(html).not.toContain("undefined");
    });
  });

  describe("MagicLinkEmail", () => {
    it("renders with magic link and expiry", async () => {
      const html = await render(
        MagicLinkEmail({
          magicLink: "https://example.com/auth/magic?token=abc123",
          expiryMinutes: 10,
        }),
      );
      expect(html).toContain("https://example.com/auth/magic?token=abc123");
      expect(html).toContain("10");
    });
  });

  describe("OtpEmail", () => {
    it("renders with 6-digit code and expiry", async () => {
      const html = await render(OtpEmail({ code: "123456", expiryMinutes: 5 }));
      expect(html).toContain("123456");
      expect(html).toContain("5");
    });
  });

  describe("ResetPasswordEmail", () => {
    it("renders with reset link and expiry", async () => {
      const html = await render(
        ResetPasswordEmail({
          resetLink: "https://example.com/reset?token=xyz789",
          expiryHours: 1,
        }),
      );
      expect(html).toContain("https://example.com/reset?token=xyz789");
      expect(html).toContain("1");
    });
  });

  describe("SubscriptionEmail", () => {
    it("renders with plan details", async () => {
      const html = await render(
        SubscriptionEmail({
          name: "Jade",
          planName: "Pro",
          amount: 19000,
          currency: "KRW",
          periodEnd: "2026-02-01",
          dashboardUrl: "https://example.com/dashboard",
        }),
      );
      expect(html).toContain("Pro");
      expect(html).toContain("19,000");
      expect(html).toContain("KRW");
      expect(html).toContain("https://example.com/dashboard");
    });

    it("renders without optional props", async () => {
      const html = await render(
        SubscriptionEmail({
          planName: "Pro",
          amount: 19000,
          currency: "KRW",
          dashboardUrl: "https://example.com/dashboard",
        }),
      );
      expect(html).toBeTruthy();
      expect(html).not.toContain("undefined");
    });
  });
});
