import type { SocialProvider } from "@/shared/types";

/**
 * Authentication configuration.
 * Defines password rules, social providers, and token expiry settings.
 * Source: PRD section 4.1
 */
export const authConfig = {
  /** Supported social OAuth providers (PRD 4.1.2) */
  providers: [
    "google",
  ] as const satisfies readonly SocialProvider[],

  /** Password validation rules (PRD 4.1.1) */
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  },

  /** Forgot password settings (PRD 4.1.1) */
  forgotPassword: {
    expiryHours: 1,
    rateLimitPerHour: 5,
  },

  /** Email verification settings (PRD 4.1.5) */
  emailVerification: {
    resendCooldownSeconds: 60,
  },
} as const;

export type AuthConfig = typeof authConfig;
