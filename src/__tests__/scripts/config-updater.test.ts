import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all module functions before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("../../../scripts/lib/modules/blog", () => ({
  removeBlog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/payments", () => ({
  removePayments: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/theme", () => ({
  removeTheme: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/i18n", () => ({
  configureI18n: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/auth", () => ({
  configureAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/magic-link-otp", () => ({
  removeMagicLink: vi.fn().mockResolvedValue(undefined),
  removeOtp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../scripts/lib/modules/email", () => ({
  removeEmail: vi.fn().mockResolvedValue(undefined),
}));

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
}));
vi.mock("node:child_process", () => ({
  default: { execSync: mockExecSync },
  execSync: mockExecSync,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { updateProject } from "../../../scripts/lib/config-updater";
import type { SetupConfig } from "../../../scripts/lib/types";

import { removeBlog } from "../../../scripts/lib/modules/blog";
import { removePayments } from "../../../scripts/lib/modules/payments";
import { removeTheme } from "../../../scripts/lib/modules/theme";
import { configureI18n } from "../../../scripts/lib/modules/i18n";
import { configureAuth } from "../../../scripts/lib/modules/auth";
import {
  removeMagicLink,
  removeOtp,
} from "../../../scripts/lib/modules/magic-link-otp";
import { removeEmail } from "../../../scripts/lib/modules/email";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = "/fake/project";

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  // -----------------------------------------------------------------------
  // Blog module
  // -----------------------------------------------------------------------

  describe("blog", () => {
    it("calls removeBlog when blog is false", async () => {
      await updateProject(makeConfig({ blog: false }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeBlog).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
    });

    it("does NOT call removeBlog when blog is true", async () => {
      await updateProject(makeConfig({ blog: true }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeBlog).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Payments module
  // -----------------------------------------------------------------------

  describe("payments", () => {
    it("calls removePayments when payments is false", async () => {
      await updateProject(makeConfig({ payments: false }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removePayments).toHaveBeenCalledWith(PROJECT_ROOT, {
        dryRun: true,
      });
    });

    it("does NOT call removePayments when payments is true", async () => {
      await updateProject(makeConfig({ payments: true }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removePayments).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Theme module
  // -----------------------------------------------------------------------

  describe("darkMode", () => {
    it("calls removeTheme when darkMode is false", async () => {
      await updateProject(makeConfig({ darkMode: false }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeTheme).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
    });

    it("does NOT call removeTheme when darkMode is true", async () => {
      await updateProject(makeConfig({ darkMode: true }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeTheme).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // i18n module
  // -----------------------------------------------------------------------

  describe("locale", () => {
    it('calls configureI18n with "ko" when locale is "ko"', async () => {
      await updateProject(makeConfig({ locale: "ko" }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(configureI18n).toHaveBeenCalledWith(PROJECT_ROOT, "ko", {
        dryRun: true,
      });
    });

    it('calls configureI18n with "en" when locale is "en"', async () => {
      await updateProject(makeConfig({ locale: "en" }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(configureI18n).toHaveBeenCalledWith(PROJECT_ROOT, "en", {
        dryRun: true,
      });
    });

    it('does NOT call configureI18n when locale is "both"', async () => {
      await updateProject(makeConfig({ locale: "both" }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(configureI18n).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Email module
  // -----------------------------------------------------------------------

  describe("email", () => {
    it("calls removeEmail when email is false", async () => {
      await updateProject(makeConfig({ email: false }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeEmail).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
    });

    it("does NOT call removeEmail when email is true", async () => {
      await updateProject(makeConfig({ email: true }), PROJECT_ROOT, {
        dryRun: true,
      });

      expect(removeEmail).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Email + magic-link/OTP dependency
  // -----------------------------------------------------------------------

  describe("email dependency: magic-link and OTP", () => {
    it("force-removes magic-link and OTP when email is false", async () => {
      await updateProject(
        makeConfig({
          email: false,
          authMethods: ["email-password", "magic-link", "otp"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeEmail).toHaveBeenCalled();
      expect(removeMagicLink).toHaveBeenCalledWith(PROJECT_ROOT, {
        dryRun: true,
      });
      expect(removeOtp).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
    });

    it("strips magic-link and otp from auth methods when email is false", async () => {
      await updateProject(
        makeConfig({
          email: false,
          authMethods: ["email-password", "magic-link", "otp", "google"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      // configureAuth should receive methods WITHOUT magic-link and otp
      expect(configureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password", "google"],
        { dryRun: true },
      );
    });

    it("removes magic-link only when email is true but magic-link not selected", async () => {
      await updateProject(
        makeConfig({
          email: true,
          authMethods: ["email-password", "otp"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeEmail).not.toHaveBeenCalled();
      expect(removeMagicLink).toHaveBeenCalledWith(PROJECT_ROOT, {
        dryRun: true,
      });
      expect(removeOtp).not.toHaveBeenCalled();
    });

    it("removes OTP only when email is true but OTP not selected", async () => {
      await updateProject(
        makeConfig({
          email: true,
          authMethods: ["email-password", "magic-link"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeEmail).not.toHaveBeenCalled();
      expect(removeMagicLink).not.toHaveBeenCalled();
      expect(removeOtp).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
    });

    it("keeps both magic-link and OTP when email is true and both are selected", async () => {
      await updateProject(
        makeConfig({
          email: true,
          authMethods: ["email-password", "magic-link", "otp"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeEmail).not.toHaveBeenCalled();
      expect(removeMagicLink).not.toHaveBeenCalled();
      expect(removeOtp).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Auth module (always called)
  // -----------------------------------------------------------------------

  describe("auth", () => {
    it("always calls configureAuth", async () => {
      await updateProject(makeConfig(), PROJECT_ROOT, { dryRun: true });

      expect(configureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password"],
        { dryRun: true },
      );
    });

    it("passes through all selected auth methods", async () => {
      await updateProject(
        makeConfig({
          authMethods: ["email-password", "google", "github", "kakao"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(configureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password", "google", "github", "kakao"],
        { dryRun: true },
      );
    });
  });

  // -----------------------------------------------------------------------
  // dryRun pass-through
  // -----------------------------------------------------------------------

  describe("dryRun option", () => {
    it("passes dryRun: true to all module functions", async () => {
      await updateProject(
        makeConfig({
          blog: false,
          payments: false,
          darkMode: false,
          locale: "ko",
          email: false,
          authMethods: ["email-password"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeBlog).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
      expect(removePayments).toHaveBeenCalledWith(PROJECT_ROOT, {
        dryRun: true,
      });
      expect(removeTheme).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
      expect(configureI18n).toHaveBeenCalledWith(PROJECT_ROOT, "ko", {
        dryRun: true,
      });
      expect(removeEmail).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
      expect(removeMagicLink).toHaveBeenCalledWith(PROJECT_ROOT, {
        dryRun: true,
      });
      expect(removeOtp).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: true });
      expect(configureAuth).toHaveBeenCalledWith(
        PROJECT_ROOT,
        ["email-password"],
        { dryRun: true },
      );
    });

    it("passes dryRun: false when option is not specified", async () => {
      await updateProject(
        makeConfig({ blog: false }),
        PROJECT_ROOT,
      );

      expect(removeBlog).toHaveBeenCalledWith(PROJECT_ROOT, { dryRun: false });
    });

    it("does NOT run pnpm install in dryRun mode", async () => {
      await updateProject(makeConfig(), PROJECT_ROOT, { dryRun: true });

      expect(mockExecSync).not.toHaveBeenCalled();
    });

    it("runs pnpm install when NOT in dryRun mode", async () => {
      await updateProject(makeConfig(), PROJECT_ROOT);

      expect(mockExecSync).toHaveBeenCalledWith("pnpm install", {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
        timeout: 120_000,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Idempotency
  // -----------------------------------------------------------------------

  describe("idempotency", () => {
    it("calling twice produces the same function calls", async () => {
      const config = makeConfig({
        blog: false,
        payments: false,
        darkMode: false,
        locale: "en",
        email: false,
      });

      await updateProject(config, PROJECT_ROOT, { dryRun: true });
      vi.clearAllMocks();
      await updateProject(config, PROJECT_ROOT, { dryRun: true });

      // Each module function should be called exactly once per invocation
      expect(removeBlog).toHaveBeenCalledTimes(1);
      expect(removePayments).toHaveBeenCalledTimes(1);
      expect(removeTheme).toHaveBeenCalledTimes(1);
      expect(configureI18n).toHaveBeenCalledTimes(1);
      expect(removeEmail).toHaveBeenCalledTimes(1);
      expect(removeMagicLink).toHaveBeenCalledTimes(1);
      expect(removeOtp).toHaveBeenCalledTimes(1);
      expect(configureAuth).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // Full config (nothing removed)
  // -----------------------------------------------------------------------

  describe("all features enabled", () => {
    it("only calls configureAuth when all features are enabled", async () => {
      await updateProject(
        makeConfig({
          blog: true,
          payments: true,
          darkMode: true,
          locale: "both",
          email: true,
          authMethods: ["email-password", "google", "magic-link", "otp"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeBlog).not.toHaveBeenCalled();
      expect(removePayments).not.toHaveBeenCalled();
      expect(removeTheme).not.toHaveBeenCalled();
      expect(configureI18n).not.toHaveBeenCalled();
      expect(removeEmail).not.toHaveBeenCalled();
      expect(removeMagicLink).not.toHaveBeenCalled();
      expect(removeOtp).not.toHaveBeenCalled();

      // Auth is always called
      expect(configureAuth).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // Everything disabled (maximum removal)
  // -----------------------------------------------------------------------

  describe("all features disabled", () => {
    it("calls all removal functions when everything is disabled", async () => {
      await updateProject(
        makeConfig({
          blog: false,
          payments: false,
          darkMode: false,
          locale: "ko",
          email: false,
          authMethods: ["email-password"],
        }),
        PROJECT_ROOT,
        { dryRun: true },
      );

      expect(removeBlog).toHaveBeenCalledTimes(1);
      expect(removePayments).toHaveBeenCalledTimes(1);
      expect(removeTheme).toHaveBeenCalledTimes(1);
      expect(configureI18n).toHaveBeenCalledTimes(1);
      expect(removeEmail).toHaveBeenCalledTimes(1);
      expect(removeMagicLink).toHaveBeenCalledTimes(1);
      expect(removeOtp).toHaveBeenCalledTimes(1);
      expect(configureAuth).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // pnpm install error handling
  // -----------------------------------------------------------------------

  describe("pnpm install error handling", () => {
    it("warns but does not throw when pnpm install fails", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("pnpm not found");
      });

      // Should not throw
      await expect(
        updateProject(makeConfig(), PROJECT_ROOT),
      ).resolves.toBeUndefined();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("pnpm install failed"),
      );
    });
  });
});
