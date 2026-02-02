import { execSync } from "node:child_process";

import type { SetupConfig, AuthMethod } from "./types";
import { EMAIL_DEPENDENT_AUTH } from "./types";

import { removeBlog } from "./modules/blog";
import { removePayments } from "./modules/payments";
import { removeTheme } from "./modules/theme";
import { configureI18n } from "./modules/i18n";
import { configureAuth } from "./modules/auth";
import { removeMagicLink, removeOtp } from "./modules/magic-link-otp";
import { removeEmail } from "./modules/email";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_PREFIX = "  [config-updater]";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply project configuration by selectively removing modules the user
 * did not select. This is the single orchestration entry point that
 * downstream callers (e.g. the CLI setup script) invoke after collecting
 * user preferences via prompts.
 *
 * **Ordering rules:**
 *   1. Email removal runs before magic-link/OTP removal because
 *      `email === false` forces both `magic-link` and `otp` off.
 *   2. Auth configuration always runs last so that the auth module
 *      sees the final, already-cleaned project state.
 *
 * **Idempotency:** Each module function is individually idempotent —
 * files that have already been removed or configs that have already been
 * updated are silently skipped. Running `updateProject` twice with the
 * same config produces the same result.
 *
 * @param config      - The user's setup configuration selections
 * @param projectRoot - Absolute path to the project root directory
 * @param options     - Optional settings (e.g., dryRun mode)
 */
export async function updateProject(
  config: SetupConfig,
  projectRoot: string,
  options?: { dryRun?: boolean },
): Promise<void> {
  const dryRun = options?.dryRun ?? false;
  const opts = { dryRun };

  console.log("\n========================================");
  console.log("  Updating project configuration...");
  console.log("========================================\n");

  logConfig(config);

  // Resolve the effective auth methods after applying the email dependency.
  // When email is disabled, magic-link and otp must be stripped from the
  // auth methods list so that configureAuth() receives the correct set.
  const effectiveAuthMethods = resolveEffectiveAuthMethods(config);

  // -----------------------------------------------------------------------
  // 1. Blog removal
  // -----------------------------------------------------------------------
  if (!config.blog) {
    logStep(1, "Removing blog module...");
    await removeBlog(projectRoot, opts);
  } else {
    logSkip(1, "Blog module (included)");
  }

  // -----------------------------------------------------------------------
  // 2. Payments removal
  // -----------------------------------------------------------------------
  if (!config.payments) {
    logStep(2, "Removing payments module...");
    await removePayments(projectRoot, opts);
  } else {
    logSkip(2, "Payments module (included)");
  }

  // -----------------------------------------------------------------------
  // 3. Theme / dark mode removal
  // -----------------------------------------------------------------------
  if (!config.darkMode) {
    logStep(3, "Removing theme/dark-mode module...");
    await removeTheme(projectRoot, opts);
  } else {
    logSkip(3, "Theme/dark-mode module (included)");
  }

  // -----------------------------------------------------------------------
  // 4. i18n configuration (single locale)
  // -----------------------------------------------------------------------
  if (config.locale !== "both") {
    logStep(4, `Configuring single-language mode: ${config.locale}...`);
    await configureI18n(projectRoot, config.locale, opts);
  } else {
    logSkip(4, "i18n (both locales kept)");
  }

  // -----------------------------------------------------------------------
  // 5. Email removal (must run BEFORE magic-link/OTP checks)
  //    When email is disabled, magic-link and OTP are also force-removed
  //    since they depend on the email service.
  // -----------------------------------------------------------------------
  if (!config.email) {
    logStep(5, "Removing email/Resend module...");
    await removeEmail(projectRoot, opts);

    // Force-remove magic-link and OTP regardless of authMethods selection
    logStep(5, "Force-removing magic-link (email dependency)...");
    await removeMagicLink(projectRoot, opts);

    logStep(5, "Force-removing OTP (email dependency)...");
    await removeOtp(projectRoot, opts);
  } else {
    logSkip(5, "Email module (included)");

    // -----------------------------------------------------------------------
    // 6. Magic-link / OTP removal (only when email IS enabled)
    //    If email is enabled but magic-link or otp was not selected as an
    //    auth method, remove just that specific module.
    // -----------------------------------------------------------------------
    if (!effectiveAuthMethods.includes("magic-link")) {
      logStep(6, "Removing magic-link module (not selected)...");
      await removeMagicLink(projectRoot, opts);
    } else {
      logSkip(6, "Magic-link module (included)");
    }

    if (!effectiveAuthMethods.includes("otp")) {
      logStep(6, "Removing OTP module (not selected)...");
      await removeOtp(projectRoot, opts);
    } else {
      logSkip(6, "OTP module (included)");
    }
  }

  // -----------------------------------------------------------------------
  // 7. Auth configuration (always runs)
  //    This handles OAuth provider setup based on what the user selected.
  //    It receives the effective auth methods (with email-dependent methods
  //    already stripped if email is disabled).
  // -----------------------------------------------------------------------
  logStep(7, "Configuring authentication...");
  await configureAuth(projectRoot, effectiveAuthMethods, opts);

  // -----------------------------------------------------------------------
  // 8. Install dependencies (unless dryRun)
  //    After removing modules, package.json may have changed.
  //    Run pnpm install to sync the lockfile and node_modules.
  // -----------------------------------------------------------------------
  if (!dryRun) {
    logStep(8, "Running pnpm install to sync dependencies...");
    try {
      execSync("pnpm install", {
        cwd: projectRoot,
        stdio: "inherit",
        timeout: 120_000,
      });
      console.log(`${LOG_PREFIX} pnpm install complete.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `${LOG_PREFIX} Warning: pnpm install failed — you may need to run it manually.\n  ${message}`,
      );
    }
  } else {
    logSkip(8, "pnpm install (dry-run mode)");
  }

  console.log("\n========================================");
  console.log("  Project configuration complete!");
  console.log("========================================\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the effective auth methods by stripping email-dependent methods
 * (magic-link, otp) when the email module is disabled.
 *
 * This ensures that:
 * - `configureAuth()` does not try to keep magic-link/otp providers active
 *   when their underlying email infrastructure has been removed.
 * - The returned list always includes at least `email-password` (the
 *   mandatory default).
 */
function resolveEffectiveAuthMethods(config: SetupConfig): AuthMethod[] {
  if (config.email) {
    return config.authMethods;
  }

  // email === false: strip all email-dependent auth methods
  return config.authMethods.filter(
    (method) => !(EMAIL_DEPENDENT_AUTH as string[]).includes(method),
  );
}

/**
 * Log the user's configuration summary before starting.
 */
function logConfig(config: SetupConfig): void {
  console.log(`${LOG_PREFIX} Configuration summary:`);
  console.log(`  Project name : ${config.projectName}`);
  console.log(`  Auth methods : ${config.authMethods.join(", ")}`);
  console.log(`  Payments     : ${config.payments ? "yes" : "no"}`);
  console.log(`  Locale       : ${config.locale}`);
  console.log(`  Dark mode    : ${config.darkMode ? "yes" : "no"}`);
  console.log(`  Email        : ${config.email ? "yes" : "no"}`);
  console.log(`  Blog         : ${config.blog ? "yes" : "no"}`);

  // Warn about the email dependency
  if (!config.email) {
    const forced = config.authMethods.filter((m) =>
      (EMAIL_DEPENDENT_AUTH as string[]).includes(m),
    );
    if (forced.length > 0) {
      console.log(
        `\n${LOG_PREFIX} Note: email is disabled, so ${forced.join(" and ")} will also be removed.`,
      );
    }
  }

  console.log("");
}

/**
 * Log a numbered step starting.
 */
function logStep(step: number, message: string): void {
  console.log(`${LOG_PREFIX} [Step ${step}] ${message}`);
}

/**
 * Log a numbered step being skipped.
 */
function logSkip(step: number, label: string): void {
  console.log(`${LOG_PREFIX} [Step ${step}] Skipping: ${label}`);
}
