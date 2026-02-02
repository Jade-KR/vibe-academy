import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all module-level functions to verify orchestration wiring.
// These tests validate that updateProject and generateDocs are called
// with the correct arguments for different SetupConfig scenarios.
// ---------------------------------------------------------------------------

const {
  mockRemoveBlog,
  mockRemovePayments,
  mockRemoveTheme,
  mockConfigureI18n,
  mockConfigureAuth,
  mockRemoveMagicLink,
  mockRemoveOtp,
  mockRemoveEmail,
  mockGenerateDocs,
  mockExecSync,
} = vi.hoisted(() => ({
  mockRemoveBlog: vi.fn().mockResolvedValue(undefined),
  mockRemovePayments: vi.fn().mockResolvedValue(undefined),
  mockRemoveTheme: vi.fn().mockResolvedValue(undefined),
  mockConfigureI18n: vi.fn().mockResolvedValue(undefined),
  mockConfigureAuth: vi.fn().mockResolvedValue(undefined),
  mockRemoveMagicLink: vi.fn().mockResolvedValue(undefined),
  mockRemoveOtp: vi.fn().mockResolvedValue(undefined),
  mockRemoveEmail: vi.fn().mockResolvedValue(undefined),
  mockGenerateDocs: vi.fn().mockResolvedValue(undefined),
  mockExecSync: vi.fn(),
}));

vi.mock("../../../scripts/lib/modules/blog", () => ({
  removeBlog: mockRemoveBlog,
}));

vi.mock("../../../scripts/lib/modules/payments", () => ({
  removePayments: mockRemovePayments,
}));

vi.mock("../../../scripts/lib/modules/theme", () => ({
  removeTheme: mockRemoveTheme,
}));

vi.mock("../../../scripts/lib/modules/i18n", () => ({
  configureI18n: mockConfigureI18n,
}));

vi.mock("../../../scripts/lib/modules/auth", () => ({
  configureAuth: mockConfigureAuth,
}));

vi.mock("../../../scripts/lib/modules/magic-link-otp", () => ({
  removeMagicLink: mockRemoveMagicLink,
  removeOtp: mockRemoveOtp,
}));

vi.mock("../../../scripts/lib/modules/email", () => ({
  removeEmail: mockRemoveEmail,
}));

vi.mock("../../../scripts/lib/doc-generator", () => ({
  generateDocs: mockGenerateDocs,
}));
vi.mock("node:child_process", () => ({
  default: { execSync: mockExecSync },
  execSync: mockExecSync,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { updateProject } from "../../../scripts/lib/config-updater";
import { generateDocs } from "../../../scripts/lib/doc-generator";
import type { SetupConfig } from "../../../scripts/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<SetupConfig> = {}): SetupConfig {
  return {
    projectName: "test-project",
    authMethods: ["email-password"],
    payments: true,
    locale: "both",
    darkMode: true,
    email: true,
    blog: false,
    ...overrides,
  };
}

const PROJECT_ROOT = "/fake/project";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Setup Integration: Full pipeline scenarios", () => {
  describe("Scenario: Minimal config (everything disabled except auth)", () => {
    const config = makeConfig({
      projectName: "minimal-app",
      authMethods: ["email-password"],
      payments: false,
      locale: "ko",
      darkMode: false,
      email: false,
      blog: false,
    });

    it("removes blog, payments, theme, and email modules", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveBlog).toHaveBeenCalledOnce();
      expect(mockRemovePayments).toHaveBeenCalledOnce();
      expect(mockRemoveTheme).toHaveBeenCalledOnce();
      expect(mockRemoveEmail).toHaveBeenCalledOnce();
    });

    it("configures i18n for single locale", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureI18n).toHaveBeenCalledWith(
        PROJECT_ROOT,
        "ko",
        expect.objectContaining({ dryRun: false }),
      );
    });

    it("force-removes magic-link and OTP when email is disabled", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveMagicLink).toHaveBeenCalledOnce();
      expect(mockRemoveOtp).toHaveBeenCalledOnce();
    });

    it("still configures auth (always runs)", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password"],
        expect.objectContaining({ dryRun: false }),
      );
    });

    it("generates docs with the same config", async () => {
      await generateDocs(config, PROJECT_ROOT);

      expect(mockGenerateDocs).toHaveBeenCalledWith(
        config,
        PROJECT_ROOT,
      );
    });
  });

  describe("Scenario: Full config (everything enabled)", () => {
    const config = makeConfig({
      projectName: "full-app",
      authMethods: [
        "email-password",
        "google",
        "github",
        "kakao",
        "magic-link",
        "otp",
      ],
      payments: true,
      locale: "both",
      darkMode: true,
      email: true,
      blog: true,
    });

    it("does NOT remove any modules", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveBlog).not.toHaveBeenCalled();
      expect(mockRemovePayments).not.toHaveBeenCalled();
      expect(mockRemoveTheme).not.toHaveBeenCalled();
      expect(mockRemoveEmail).not.toHaveBeenCalled();
    });

    it("does NOT configure i18n (both locales kept)", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureI18n).not.toHaveBeenCalled();
    });

    it("does NOT remove magic-link or OTP (email enabled + selected)", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveMagicLink).not.toHaveBeenCalled();
      expect(mockRemoveOtp).not.toHaveBeenCalled();
    });

    it("configures auth with all selected methods", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        [
          "email-password",
          "google",
          "github",
          "kakao",
          "magic-link",
          "otp",
        ],
        expect.objectContaining({ dryRun: false }),
      );
    });
  });

  describe("Scenario: No blog + no payments (common SaaS)", () => {
    const config = makeConfig({
      projectName: "saas-app",
      authMethods: ["email-password", "google"],
      payments: false,
      locale: "both",
      darkMode: true,
      email: true,
      blog: false,
    });

    it("removes blog and payments, keeps theme and email", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveBlog).toHaveBeenCalledOnce();
      expect(mockRemovePayments).toHaveBeenCalledOnce();
      expect(mockRemoveTheme).not.toHaveBeenCalled();
      expect(mockRemoveEmail).not.toHaveBeenCalled();
    });

    it("removes magic-link and OTP (not selected, email enabled)", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveMagicLink).toHaveBeenCalledOnce();
      expect(mockRemoveOtp).toHaveBeenCalledOnce();
    });

    it("passes only selected auth methods to configureAuth", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password", "google"],
        expect.objectContaining({ dryRun: false }),
      );
    });
  });

  describe("Scenario: Single language (English only)", () => {
    const config = makeConfig({
      locale: "en",
    });

    it("configures i18n with English locale", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockConfigureI18n).toHaveBeenCalledWith(
        PROJECT_ROOT,
        "en",
        expect.objectContaining({ dryRun: false }),
      );
    });
  });

  describe("Scenario: No dark mode + no email", () => {
    const config = makeConfig({
      darkMode: false,
      email: false,
    });

    it("removes theme module", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveTheme).toHaveBeenCalledOnce();
    });

    it("removes email and force-removes magic-link/OTP", async () => {
      await updateProject(config, PROJECT_ROOT);

      expect(mockRemoveEmail).toHaveBeenCalledOnce();
      expect(mockRemoveMagicLink).toHaveBeenCalledOnce();
      expect(mockRemoveOtp).toHaveBeenCalledOnce();
    });
  });

  describe("Scenario: Email disabled strips magic-link from auth methods", () => {
    const config = makeConfig({
      authMethods: ["email-password", "google", "magic-link", "otp"],
      email: false,
    });

    it("passes auth methods without email-dependent ones to configureAuth", async () => {
      await updateProject(config, PROJECT_ROOT);

      // magic-link and otp should be stripped because email=false
      expect(mockConfigureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password", "google"],
        expect.objectContaining({ dryRun: false }),
      );
    });
  });

  describe("Dry-run mode", () => {
    const config = makeConfig({
      blog: false,
      payments: false,
    });

    it("passes dryRun option through to all module functions", async () => {
      await updateProject(config, PROJECT_ROOT, { dryRun: true });

      expect(mockRemoveBlog).toHaveBeenCalledWith(
        PROJECT_ROOT,
        expect.objectContaining({ dryRun: true }),
      );
      expect(mockRemovePayments).toHaveBeenCalledWith(
        PROJECT_ROOT,
        expect.objectContaining({ dryRun: true }),
      );
      expect(mockConfigureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password"],
        expect.objectContaining({ dryRun: true }),
      );
    });

    it("skips pnpm install in dryRun mode", async () => {
      await updateProject(config, PROJECT_ROOT, { dryRun: true });

      expect(mockExecSync).not.toHaveBeenCalled();
    });
  });

  describe("Execution order", () => {
    it("calls configureAuth after all removals", async () => {
      const callOrder: string[] = [];

      mockRemoveBlog.mockImplementation(async () => {
        callOrder.push("removeBlog");
      });
      mockRemovePayments.mockImplementation(async () => {
        callOrder.push("removePayments");
      });
      mockRemoveTheme.mockImplementation(async () => {
        callOrder.push("removeTheme");
      });
      mockConfigureI18n.mockImplementation(async () => {
        callOrder.push("configureI18n");
      });
      mockRemoveEmail.mockImplementation(async () => {
        callOrder.push("removeEmail");
      });
      mockRemoveMagicLink.mockImplementation(async () => {
        callOrder.push("removeMagicLink");
      });
      mockRemoveOtp.mockImplementation(async () => {
        callOrder.push("removeOtp");
      });
      mockConfigureAuth.mockImplementation(async () => {
        callOrder.push("configureAuth");
      });

      const config = makeConfig({
        blog: false,
        payments: false,
        darkMode: false,
        locale: "ko",
        email: false,
      });

      await updateProject(config, PROJECT_ROOT, { dryRun: true });

      // configureAuth must be the last module call
      const authIndex = callOrder.indexOf("configureAuth");
      expect(authIndex).toBe(callOrder.length - 1);

      // email removal must come before magic-link/OTP removal
      const emailIndex = callOrder.indexOf("removeEmail");
      const mlIndex = callOrder.indexOf("removeMagicLink");
      const otpIndex = callOrder.indexOf("removeOtp");
      expect(emailIndex).toBeLessThan(mlIndex);
      expect(emailIndex).toBeLessThan(otpIndex);
    });
  });

  describe("Pipeline: updateProject + generateDocs", () => {
    it("both functions can be called sequentially without error", async () => {
      const config = makeConfig({
        projectName: "pipeline-test",
        blog: false,
        payments: false,
      });

      // This simulates the setup.ts flow
      await updateProject(config, PROJECT_ROOT, { dryRun: true });
      await generateDocs(config, PROJECT_ROOT, { dryRun: true });

      // updateProject should have called the removal functions
      expect(mockRemoveBlog).toHaveBeenCalledOnce();
      expect(mockRemovePayments).toHaveBeenCalledOnce();

      // generateDocs should have been called
      expect(mockGenerateDocs).toHaveBeenCalledWith(
        config,
        PROJECT_ROOT,
        { dryRun: true },
      );
    });

    it("generateDocs receives the same config as updateProject", async () => {
      const config = makeConfig({
        projectName: "shared-config",
        authMethods: ["email-password", "github"],
        payments: true,
        email: true,
        blog: true,
      });

      await updateProject(config, PROJECT_ROOT);
      await generateDocs(config, PROJECT_ROOT);

      const docsCall = mockGenerateDocs.mock.calls[0];
      expect(docsCall[0]).toBe(config);
      expect(docsCall[1]).toBe(PROJECT_ROOT);
    });
  });

  describe("Error resilience", () => {
    it("updateProject propagates module errors", async () => {
      mockRemoveBlog.mockRejectedValueOnce(new Error("disk full"));

      const config = makeConfig({ blog: false });

      await expect(
        updateProject(config, PROJECT_ROOT),
      ).rejects.toThrow("disk full");
    });

    it("pnpm install failure does not throw (warning only)", async () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("pnpm not found");
      });

      const config = makeConfig();

      // Should not throw despite pnpm failure
      await expect(
        updateProject(config, PROJECT_ROOT),
      ).resolves.toBeUndefined();
    });
  });
});
