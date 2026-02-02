import path from "node:path";

import type { Locale } from "../types";
import {
  type FileOperationOptions,
  fileExists,
  readFileContent,
  removeDirectory,
  removeFile,
  removeLinesByPattern,
  replaceInFile,
  writeFileContent,
} from "../file-operations";
import { MODULE_MAP, resolveModulePaths } from "../module-map";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_PREFIX = {
  info: "  [i18n]",
  step: "  [i18n]",
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Configure i18n for single-language mode.
 *
 * Strategy: Keep next-intl infrastructure but lock it to a single locale.
 * This avoids ripping out the entire `[locale]` route group and
 * rewriting every `useTranslations` call. Instead:
 *
 *   1. Update `src/i18n/config.ts` — restrict locales array to single locale
 *   2. Update `src/i18n/routing.ts` — set `localePrefix: "as-needed"` so
 *      the default locale doesn't require a URL prefix
 *   3. Remove the unused locale's JSON file
 *   4. Remove the language-switcher widget and locale feature directories
 *   5. Remove LanguageSwitcher usage from header.tsx and top-bar.tsx
 *   6. Remove "locale" translation keys from the remaining locale file
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param selectedLocale - The locale to keep ("ko" or "en")
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function configureI18n(
  projectRoot: string,
  selectedLocale: Locale,
  options?: FileOperationOptions,
): Promise<void> {
  // "both" means keep all locales — nothing to remove except maybe the switcher
  if (selectedLocale === "both") {
    console.log(`\n${LOG_PREFIX.info} Both locales selected — nothing to remove.`);
    return;
  }

  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const removedLocale = selectedLocale === "ko" ? "en" : "ko";

  console.log(`\n${LOG_PREFIX.info} Configuring single-language mode: ${selectedLocale}`);
  console.log(`  Keeping: ${selectedLocale}, Removing: ${removedLocale}`);

  // -------------------------------------------------------------------------
  // 1. Update i18n/config.ts — restrict locales to single locale
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Updating i18n config...`);
  await updateI18nConfig(projectRoot, selectedLocale, opts);

  // -------------------------------------------------------------------------
  // 2. Update i18n/routing.ts — set localePrefix to "as-needed"
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Updating i18n routing...`);
  await updateI18nRouting(projectRoot, opts);

  // -------------------------------------------------------------------------
  // 3. Remove the unused locale's translation JSON file
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing unused locale file...`);
  const removedLocalePath = path.resolve(
    projectRoot,
    `public/locales/${removedLocale}/common.json`,
  );
  await removeFile(removedLocalePath, opts);

  // Also remove the empty directory
  const removedLocaleDir = path.resolve(
    projectRoot,
    `public/locales/${removedLocale}`,
  );
  await removeDirectory(removedLocaleDir, opts);

  // -------------------------------------------------------------------------
  // 4. Remove language-switcher widget and locale feature directories
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing language-switcher directories...`);
  const resolved = resolveModulePaths(MODULE_MAP.languageSwitcher, projectRoot);

  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // -------------------------------------------------------------------------
  // 5. Remove LanguageSwitcher import and usage from header.tsx
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing LanguageSwitcher from header...`);
  await removeLanguageSwitcherFromComponent(
    path.resolve(projectRoot, "src/widgets/header/ui/header.tsx"),
    opts,
  );

  // -------------------------------------------------------------------------
  // 6. Remove LanguageSwitcher import and usage from top-bar.tsx
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing LanguageSwitcher from top-bar...`);
  await removeLanguageSwitcherFromComponent(
    path.resolve(projectRoot, "src/widgets/top-bar/ui/top-bar.tsx"),
    opts,
  );

  // -------------------------------------------------------------------------
  // 7. Remove "locale" translation keys from remaining locale file
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing locale translation keys...`);
  const keptLocalePath = path.resolve(
    projectRoot,
    `public/locales/${selectedLocale}/common.json`,
  );
  await removeLocaleTranslationKeys(keptLocalePath, opts);

  // -------------------------------------------------------------------------
  // 8. Remove LanguageSwitcher exports from widget barrel (if exists)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Cleaning up barrel exports...`);
  const widgetBarrelPath = path.resolve(
    projectRoot,
    "src/widgets/language-switcher/index.ts",
  );
  // The barrel file should be gone after directory removal, but check just in case
  if (await fileExists(widgetBarrelPath)) {
    await removeFile(widgetBarrelPath, opts);
  }

  const featureBarrelPath = path.resolve(
    projectRoot,
    "src/features/locale/index.ts",
  );
  if (await fileExists(featureBarrelPath)) {
    await removeFile(featureBarrelPath, opts);
  }

  console.log(`${LOG_PREFIX.info} Single-language configuration complete.\n`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rewrite `src/i18n/config.ts` to only export the selected locale.
 *
 * Before:
 *   export const locales = ["ko", "en"] as const;
 *   export type Locale = (typeof locales)[number];
 *   export const defaultLocale: Locale = "ko";
 *
 * After:
 *   export const locales = ["ko"] as const;
 *   export type Locale = (typeof locales)[number];
 *   export const defaultLocale: Locale = "ko";
 */
async function updateI18nConfig(
  projectRoot: string,
  selectedLocale: Locale,
  opts: FileOperationOptions,
): Promise<void> {
  const configPath = path.resolve(projectRoot, "src/i18n/config.ts");

  if (!(await fileExists(configPath))) {
    console.log(`  \u26A0 File not found: ${configPath}`);
    return;
  }

  const content = await readFileContent(configPath);

  // Replace the locales array to only include the selected locale
  let updated = content.replace(
    /export const locales = \[.*?\] as const;/,
    `export const locales = ["${selectedLocale}"] as const;`,
  );

  // Update defaultLocale to the selected locale
  updated = updated.replace(
    /export const defaultLocale: Locale = "(?:ko|en)";/,
    `export const defaultLocale: Locale = "${selectedLocale}";`,
  );

  if (content === updated) {
    console.log(`  \u26A0 No changes needed in: ${configPath}`);
    return;
  }

  await writeFileContent(configPath, updated, opts);
}

/**
 * Update `src/i18n/routing.ts` to use `localePrefix: "as-needed"`.
 *
 * With a single locale, always prefixing URLs with the locale is unnecessary.
 * "as-needed" means the default locale won't have a prefix in the URL,
 * so `/dashboard` works instead of requiring `/ko/dashboard`.
 */
async function updateI18nRouting(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const routingPath = path.resolve(projectRoot, "src/i18n/routing.ts");

  if (!(await fileExists(routingPath))) {
    console.log(`  \u26A0 File not found: ${routingPath}`);
    return;
  }

  // Change localePrefix from "always" to "as-needed"
  await replaceInFile(
    routingPath,
    /localePrefix:\s*"always"/,
    'localePrefix: "as-needed"',
    opts,
  );

  // Disable localeDetection since there's only one locale
  await replaceInFile(
    routingPath,
    /localeDetection:\s*true/,
    "localeDetection: false",
    opts,
  );
}

/**
 * Remove LanguageSwitcher import and JSX usage from a component file.
 */
async function removeLanguageSwitcherFromComponent(
  filePath: string,
  opts: FileOperationOptions,
): Promise<void> {
  if (!(await fileExists(filePath))) {
    console.log(`  \u26A0 File not found: ${filePath}`);
    return;
  }

  // Remove import line for LanguageSwitcher
  await removeLinesByPattern(
    filePath,
    /import\s+\{.*LanguageSwitcher.*\}\s+from\s+["']@\/widgets\/language-switcher["'];?/,
    opts,
  );

  // Remove <LanguageSwitcher /> JSX usage
  await replaceInFile(
    filePath,
    /\s*<LanguageSwitcher\s*\/>\n?/g,
    "\n",
    opts,
  );
}

/**
 * Remove the "locale" key from a locale JSON file.
 *
 * This key contains language display names ("한국어", "English") and the
 * "switchLanguage" label — none of which are needed in single-language mode.
 */
async function removeLocaleTranslationKeys(
  filePath: string,
  opts: FileOperationOptions,
): Promise<void> {
  try {
    if (!(await fileExists(filePath))) {
      console.log(`  \u26A0 Locale file not found: ${filePath}`);
      return;
    }

    const content = await readFileContent(filePath);
    const json = JSON.parse(content) as Record<string, unknown>;

    if (!("locale" in json)) {
      console.log(`  \u26A0 No "locale" key found in: ${filePath}`);
      return;
    }

    if (opts.dryRun) {
      console.log(`  [dry-run] Would remove "locale" key from: ${filePath}`);
      return;
    }

    delete json.locale;
    await writeFileContent(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`  \u2713 Removed "locale" translations from: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing locale translations: ${message}`);
  }
}
