import path from "node:path";

import {
  removeDirectory,
  removeFile,
  replaceInFile,
  removeLinesByPattern,
  removeDependencyFromPackageJson,
  fileExists,
  readFileContent,
  writeFileContent,
  type FileOperationOptions,
} from "../file-operations";
import { MODULE_MAP, resolveModulePaths } from "../module-map";

// ---------------------------------------------------------------------------
// Payment module removal
// ---------------------------------------------------------------------------

/**
 * Completely removes the payment (Polar) module from the project.
 *
 * This includes:
 * - Directories & files listed in MODULE_MAP.payments
 * - Navigation entries (pricing in marketingNav)
 * - PricingTable import/usage from the landing page
 * - Payment-related translation keys from locale files
 * - @polar-sh/sdk dependency from package.json
 * - POLAR_* environment variables from .env.example
 * - Subscription/payment schema exports from DB schema
 * - Payment-related enums from DB enums
 * - Dashboard components that import subscription entities
 * - Payment validation exports from validations barrel
 * - Subscription email template export from resend barrel
 * - Payment-related re-exports from src/db/index.ts
 */
export async function removePayments(
  projectRoot: string,
  options?: { dryRun?: boolean },
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.payments, projectRoot);

  console.log("\n--- Removing Payment Module ---\n");

  // 1. Remove all directories
  console.log("[1/12] Removing payment directories...");
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // 2. Remove individual files
  console.log("\n[2/12] Removing payment files...");
  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // 3. Remove pricing entry from navigation.ts (marketingNav)
  console.log("\n[3/12] Cleaning navigation config...");
  await removeNavigationEntries(projectRoot, opts);

  // 4. Remove PricingTable from landing page
  console.log("\n[4/12] Removing PricingTable from landing page...");
  await removePricingFromLandingPage(projectRoot, opts);

  // 5. Remove payment-related translation keys from locale files
  console.log("\n[5/12] Removing payment translation keys...");
  await removePaymentTranslationKeys(projectRoot, opts);

  // 6. Remove @polar-sh/sdk from package.json
  console.log("\n[6/12] Removing payment dependencies from package.json...");
  await removeDependencyFromPackageJson(
    path.join(projectRoot, "package.json"),
    resolved.dependencies,
    opts,
  );

  // 7. Remove POLAR_* environment variables from .env.example
  console.log("\n[7/12] Removing POLAR_* env vars from .env.example...");
  await removeEnvVars(projectRoot, opts);

  // 8. Remove subscription/payment schema exports from src/db/schema/index.ts
  console.log("\n[8/12] Cleaning DB schema exports...");
  await cleanDbSchemaIndex(projectRoot, opts);

  // 9. Remove payment-related enums from src/db/schema/enums.ts
  console.log("\n[9/12] Cleaning DB enums...");
  await cleanDbEnums(projectRoot, opts);

  // 10. Clean up dashboard components that import subscription entities
  console.log("\n[10/12] Cleaning dashboard stats card...");
  await cleanDashboardStatsCard(projectRoot, opts);

  // 11. Remove payment validation exports from validations barrel
  console.log("\n[11/12] Cleaning validation exports...");
  await cleanValidationExports(projectRoot, opts);

  // 12. Remove SubscriptionEmail export from resend barrel + clean db/index.ts
  console.log("\n[12/12] Cleaning resend exports and DB barrel...");
  await cleanResendExports(projectRoot, opts);
  await cleanDbBarrel(projectRoot, opts);

  console.log("\n--- Payment Module Removal Complete ---\n");
}

// ---------------------------------------------------------------------------
// Step 3: Navigation config cleanup
// ---------------------------------------------------------------------------

async function removeNavigationEntries(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const navPath = path.join(projectRoot, "src/shared/config/navigation.ts");

  if (!(await fileExists(navPath))) return;

  // Remove the pricing entry from marketingNav
  // Match the entire line:  { key: "pricing", href: "/pricing", labelKey: "nav.pricing" },
  await replaceInFile(
    navPath,
    /\s*\{\s*key:\s*"pricing"[^}]*\},?\n/,
    "\n",
    opts,
  );
}

// ---------------------------------------------------------------------------
// Step 4: Landing page cleanup (PricingTable)
// ---------------------------------------------------------------------------

async function removePricingFromLandingPage(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const landingPath = path.join(
    projectRoot,
    "src/widgets/landing/ui/landing-content.tsx",
  );

  if (!(await fileExists(landingPath))) return;

  // Remove the PricingTable import line
  await removeLinesByPattern(
    landingPath,
    /import\s*\{?\s*PricingTable\s*\}?\s*from\s*["']@\/widgets\/pricing-table["']/,
    opts,
  );

  // Remove <PricingTable /> usage (with possible whitespace around it)
  await replaceInFile(
    landingPath,
    /\s*<PricingTable\s*\/?\s*>\s*\n?/,
    "\n",
    opts,
  );
}

// ---------------------------------------------------------------------------
// Step 5: Translation key cleanup
// ---------------------------------------------------------------------------

async function removePaymentTranslationKeys(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const localeFiles = [
    path.join(projectRoot, "public/locales/ko/common.json"),
    path.join(projectRoot, "public/locales/en/common.json"),
  ];

  for (const localePath of localeFiles) {
    if (!(await fileExists(localePath))) continue;

    try {
      const content = await readFileContent(localePath);
      const json = JSON.parse(content) as Record<string, unknown>;

      // Remove "pricing" top-level key
      if ("pricing" in json) {
        delete json.pricing;
      }

      // Remove "nav.pricing" key
      const nav = json.nav as Record<string, unknown> | undefined;
      if (nav && "pricing" in nav) {
        delete nav.pricing;
      }

      // Remove payment-related dashboard keys
      const dashboard = json.dashboard as Record<string, unknown> | undefined;
      if (dashboard) {
        // Remove "stats" section (plan-related)
        if ("stats" in dashboard) {
          delete dashboard.stats;
        }
        // Remove "viewPricing" from actions
        const actions = dashboard.actions as Record<string, unknown> | undefined;
        if (actions && "viewPricing" in actions) {
          delete actions.viewPricing;
        }
      }

      // Remove "secondaryCta" from landing.hero (links to pricing)
      const landing = json.landing as Record<string, unknown> | undefined;
      if (landing) {
        const hero = landing.hero as Record<string, unknown> | undefined;
        if (hero && "secondaryCta" in hero) {
          delete hero.secondaryCta;
        }
      }

      await writeFileContent(localePath, JSON.stringify(json, null, 2) + "\n", opts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  \u26A0 Error processing translations: ${message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 7: Environment variable cleanup
// ---------------------------------------------------------------------------

async function removeEnvVars(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const envPath = path.join(projectRoot, ".env.example");

  if (!(await fileExists(envPath))) return;

  // Remove the entire Polar section including header comment and blank lines
  await replaceInFile(
    envPath,
    /# -{3,}\n# Polar \(Payments\)\n# -{3,}\n(?:.*\n)*?(?=\n# -{3,}|$)/,
    "",
    opts,
  );
}

// ---------------------------------------------------------------------------
// Step 8: DB schema index cleanup
// ---------------------------------------------------------------------------

async function cleanDbSchemaIndex(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const schemaIndexPath = path.join(projectRoot, "src/db/schema/index.ts");

  if (!(await fileExists(schemaIndexPath))) return;

  const content = await readFileContent(schemaIndexPath);

  // Build cleaned version of src/db/schema/index.ts
  // Keep: users table/types, usersRelations (without payment refs)
  // Remove: subscriptions, payments tables/types/relations, enum re-exports
  const cleaned = `import { relations } from "drizzle-orm";

// Re-export tables
export { users } from "./users";

// Re-export types
export type { User, NewUser } from "./users";

// --- Relations (defined here to avoid circular imports) ---

import { users } from "./users";

export const usersRelations = relations(users, () => ({}));
`;

  if (content !== cleaned) {
    await writeFileContent(schemaIndexPath, cleaned, opts);
  }
}

// ---------------------------------------------------------------------------
// Step 9: DB enums cleanup
// ---------------------------------------------------------------------------

async function cleanDbEnums(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const enumsPath = path.join(projectRoot, "src/db/schema/enums.ts");

  if (!(await fileExists(enumsPath))) return;

  // Since all enums in this file are payment-related,
  // replace with an empty file that keeps the module valid
  const cleaned = `// Payment-related enums removed (payment module not included)
`;

  const content = await readFileContent(enumsPath);
  if (content !== cleaned) {
    await writeFileContent(enumsPath, cleaned, opts);
  }
}

// ---------------------------------------------------------------------------
// Step 10: Dashboard stats card cleanup
// ---------------------------------------------------------------------------

async function cleanDashboardStatsCard(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const statsCardPath = path.join(
    projectRoot,
    "src/features/dashboard/ui/stats-card.tsx",
  );

  if (!(await fileExists(statsCardPath))) return;

  // Replace the stats card with a simplified version that doesn't reference
  // subscription entities or PRICING_PLANS
  const cleaned = `"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useUser } from "@/entities/user";

export function StatsCard() {
  const t = useTranslations("dashboard");
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <Card data-testid="stats-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardContent>
    </Card>
  );
}
`;

  const content = await readFileContent(statsCardPath);
  if (content !== cleaned) {
    await writeFileContent(statsCardPath, cleaned, opts);
  }
}

// ---------------------------------------------------------------------------
// Step 11: Validation exports cleanup
// ---------------------------------------------------------------------------

async function cleanValidationExports(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const validationsIndexPath = path.join(
    projectRoot,
    "src/shared/lib/validations/index.ts",
  );

  if (!(await fileExists(validationsIndexPath))) return;

  // Remove the payment export line
  await removeLinesByPattern(
    validationsIndexPath,
    /export\s*\{[^}]*\}\s*from\s*["']\.\/payment["']/,
    opts,
  );
}

// ---------------------------------------------------------------------------
// Step 12a: Resend barrel export cleanup
// ---------------------------------------------------------------------------

async function cleanResendExports(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const resendIndexPath = path.join(
    projectRoot,
    "src/shared/api/resend/index.ts",
  );

  if (!(await fileExists(resendIndexPath))) return;

  // Remove the SubscriptionEmail export line
  await removeLinesByPattern(
    resendIndexPath,
    /export\s*\{?\s*SubscriptionEmail\s*\}?\s*from\s*["']\.\/templates\/subscription["']/,
    opts,
  );
}

// ---------------------------------------------------------------------------
// Step 12b: DB barrel (src/db/index.ts) cleanup
// ---------------------------------------------------------------------------

async function cleanDbBarrel(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const dbIndexPath = path.join(projectRoot, "src/db/index.ts");

  if (!(await fileExists(dbIndexPath))) return;

  const cleaned = `// Drizzle client
export { db } from "./client";

// Schema (tables, relations)
export {
  // Tables
  users,
  // Relations
  usersRelations,
} from "./schema";

// Types
export type { User, NewUser } from "./schema";
`;

  const content = await readFileContent(dbIndexPath);
  if (content !== cleaned) {
    await writeFileContent(dbIndexPath, cleaned, opts);
  }
}
