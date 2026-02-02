import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Defines all resources associated with a removable module */
export interface ModuleFiles {
  /** Directories to remove entirely (recursive) */
  directories: string[];
  /** Individual files to remove */
  files: string[];
  /** NPM package names to remove from package.json */
  dependencies: string[];
  /** Environment variable prefixes to match and remove from .env.example */
  envVars: string[];
  /** package.json script names to remove */
  scripts: string[];
}

/** Feature toggle keys matching SetupConfig boolean fields + auth sub-features */
export type ModuleKey =
  | "blog"
  | "payments"
  | "theme"
  | "email"
  | "socialLogin"
  | "magicLink"
  | "otp"
  | "languageSwitcher";

/** Complete module dependency map */
export type ModuleMap = Record<ModuleKey, ModuleFiles>;

// ---------------------------------------------------------------------------
// Module Map
// ---------------------------------------------------------------------------

/**
 * Declarative mapping of every feature toggle to its associated
 * directories, files, dependencies, env vars, and scripts.
 *
 * All paths are relative to the project root. Downstream tasks resolve
 * them with `resolveModulePaths(moduleFiles, projectRoot)`.
 */
export const MODULE_MAP: ModuleMap = {
  blog: {
    directories: [
      "src/content/blog",
      "src/widgets/blog",
      "src/app/[locale]/(marketing)/blog",
      "src/__tests__/widgets/blog",
      "src/__tests__/app/blog",
    ],
    files: [
      "src/shared/lib/blog.ts",
      "src/__tests__/shared/lib/blog.test.ts",
    ],
    dependencies: [
      "next-mdx-remote",
      "gray-matter",
      "reading-time",
    ],
    envVars: [],
    scripts: [],
  },

  payments: {
    directories: [
      "src/entities/subscription",
      "src/entities/payment",
      "src/shared/api/polar",
      "src/widgets/pricing-table",
      "src/app/api/payments",
      "src/app/[locale]/(marketing)/pricing",
      "src/__tests__/entities/subscription",
      "src/__tests__/widgets/pricing-table",
      "src/__tests__/api/payments",
    ],
    files: [
      "src/db/schema/subscriptions.ts",
      "src/db/schema/payments.ts",
      "src/shared/lib/validations/payment.ts",
      "src/shared/api/resend/templates/subscription.tsx",
      "src/__tests__/shared/validations/payment.test.ts",
      "src/__tests__/app/marketing/pricing-page.test.tsx",
      "e2e/payment.spec.ts",
    ],
    dependencies: [
      "@polar-sh/sdk",
    ],
    envVars: [
      "POLAR_ACCESS_TOKEN",
      "POLAR_ORGANIZATION_ID",
      "POLAR_WEBHOOK_SECRET",
      "NEXT_PUBLIC_POLAR_CHECKOUT_URL",
    ],
    scripts: [],
  },

  theme: {
    directories: [
      "src/widgets/theme-toggle",
      "src/features/theme",
    ],
    files: [
      "src/shared/providers/theme-provider.tsx",
    ],
    dependencies: [
      "next-themes",
    ],
    envVars: [],
    scripts: [],
  },

  email: {
    directories: [
      "src/shared/api/resend",
      "src/__tests__/shared/api/resend",
    ],
    files: [],
    dependencies: [
      "resend",
      "@react-email/components",
      "react-email",
    ],
    envVars: [
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
    ],
    scripts: [
      "email:dev",
    ],
  },

  socialLogin: {
    directories: [
      "src/features/auth/social-login",
      "src/app/api/auth/social",
      "src/features/settings/connected-accounts",
    ],
    files: [
      "src/app/api/auth/callback/route.ts",
      "src/__tests__/api/auth/social.test.ts",
      "src/__tests__/features/auth/social-login-buttons.test.tsx",
      "src/__tests__/features/auth/hooks/use-social-login.test.ts",
    ],
    dependencies: [],
    envVars: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
      "KAKAO_CLIENT_ID",
      "KAKAO_CLIENT_SECRET",
      "NAVER_CLIENT_ID",
      "NAVER_CLIENT_SECRET",
      "APPLE_CLIENT_ID",
      "APPLE_CLIENT_SECRET",
    ],
    scripts: [],
  },

  magicLink: {
    directories: [
      "src/features/auth/magic-link",
      "src/app/api/auth/magic-link",
      "src/app/[locale]/(auth)/magic-link",
    ],
    files: [
      "src/shared/api/resend/templates/magic-link.tsx",
      "src/__tests__/api/auth/magic-link.test.ts",
      "src/__tests__/features/auth/magic-link-form.test.tsx",
      "src/__tests__/features/auth/hooks/use-magic-link.test.ts",
    ],
    dependencies: [],
    envVars: [],
    scripts: [],
  },

  otp: {
    directories: [
      "src/features/auth/otp",
      "src/app/api/auth/otp",
      "src/app/[locale]/(auth)/otp",
    ],
    files: [
      "src/shared/api/resend/templates/otp.tsx",
      "src/__tests__/api/auth/otp-send.test.ts",
      "src/__tests__/api/auth/otp-verify.test.ts",
      "src/__tests__/features/auth/otp-form.test.tsx",
      "src/__tests__/features/auth/hooks/use-otp.test.ts",
    ],
    dependencies: [],
    envVars: [],
    scripts: [],
  },

  languageSwitcher: {
    directories: [
      "src/widgets/language-switcher",
      "src/features/locale",
    ],
    files: [],
    dependencies: [],
    envVars: [],
    scripts: [],
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Resolve all paths in a ModuleFiles object to absolute paths
 * relative to the given project root.
 */
export function resolveModulePaths(
  moduleFiles: ModuleFiles,
  projectRoot: string,
): ModuleFiles {
  return {
    directories: moduleFiles.directories.map((d) => path.resolve(projectRoot, d)),
    files: moduleFiles.files.map((f) => path.resolve(projectRoot, f)),
    dependencies: [...moduleFiles.dependencies],
    envVars: [...moduleFiles.envVars],
    scripts: [...moduleFiles.scripts],
  };
}
