/**
 * Auth methods available for selection.
 * 'email-password' is always required and included by default.
 */
export type AuthMethod =
  | "email-password"
  | "google"
  | "github"
  | "kakao"
  | "naver"
  | "apple"
  | "magic-link"
  | "otp";

/**
 * Locale configuration options.
 */
export type Locale = "ko" | "en" | "both";

/**
 * Complete setup configuration collected from user prompts.
 * This interface is the single source of truth for all user selections
 * and is consumed by all downstream module handlers (task-038+).
 */
export interface SetupConfig {
  /** Project name (used for package.json name, document titles) */
  projectName: string;

  /**
   * Selected authentication methods.
   * 'email-password' is always included (enforced by prompt).
   * Social providers: google, github, kakao, naver, apple
   * Email-dependent: magic-link, otp (forced off if email=false)
   */
  authMethods: AuthMethod[];

  /** Whether to include Polar payment integration (default: true) */
  payments: boolean;

  /** Locale configuration: 'ko', 'en', or 'both' (default: 'both') */
  locale: Locale;

  /** Whether to include dark mode / theme toggle (default: true) */
  darkMode: boolean;

  /** Whether to include Resend email integration (default: true) */
  email: boolean;

  /** Whether to include MDX blog system (default: false) */
  blog: boolean;
}

/**
 * Derived helpers for downstream tasks.
 */

/** OAuth providers (subset of AuthMethod excluding email-password, magic-link, otp) */
export const OAUTH_PROVIDERS: AuthMethod[] = [
  "google",
  "github",
  "kakao",
  "naver",
  "apple",
];

/** Auth methods that require email service */
export const EMAIL_DEPENDENT_AUTH: AuthMethod[] = ["magic-link", "otp"];

/** Default config values matching PRD */
export const DEFAULT_CONFIG: Omit<SetupConfig, "projectName"> = {
  authMethods: ["email-password"],
  payments: true,
  locale: "both",
  darkMode: true,
  email: true,
  blog: false,
};
