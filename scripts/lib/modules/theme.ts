import path from "node:path";

import {
  type FileOperationOptions,
  fileExists,
  readFileContent,
  removeDirectory,
  removeFile,
  removeDependencyFromPackageJson,
  replaceInFile,
  removeLinesByPattern,
  writeFileContent,
} from "../file-operations";
import { MODULE_MAP, resolveModulePaths } from "../module-map";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_PREFIX = {
  info: "  [theme]",
  step: "  [theme]",
} as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Remove all theme / dark-mode related files, providers, imports,
 * dependencies, and configuration from the project.
 *
 * This function removes the toggle UI and provider infrastructure.
 * It does NOT strip `dark:` prefix classes from components — those
 * simply become inert without the class-based theme provider.
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function removeTheme(
  projectRoot: string,
  options?: FileOperationOptions,
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.theme, projectRoot);

  console.log(`\n${LOG_PREFIX.info} Starting theme module removal...`);

  // -------------------------------------------------------------------------
  // 1. Remove directories (widgets/theme-toggle, features/theme)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing theme directories...`);
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // -------------------------------------------------------------------------
  // 2. Remove individual files (shared/providers/theme-provider.tsx)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing theme files...`);
  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // -------------------------------------------------------------------------
  // 3. Remove ThemeToggle import and usage from header.tsx
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing ThemeToggle from header...`);
  const headerPath = path.resolve(
    projectRoot,
    "src/widgets/header/ui/header.tsx",
  );
  if (await fileExists(headerPath)) {
    // Remove import line
    await removeLinesByPattern(
      headerPath,
      /import\s+\{.*ThemeToggle.*\}\s+from\s+["']@\/widgets\/theme-toggle["'];?/,
      opts,
    );
    // Remove <ThemeToggle /> usage (with optional surrounding whitespace)
    await replaceInFile(
      headerPath,
      /\s*<ThemeToggle\s*\/>\n?/g,
      "\n",
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // 4. Remove ThemeToggle import and usage from top-bar.tsx
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing ThemeToggle from top-bar...`);
  const topBarPath = path.resolve(
    projectRoot,
    "src/widgets/top-bar/ui/top-bar.tsx",
  );
  if (await fileExists(topBarPath)) {
    // Remove import line
    await removeLinesByPattern(
      topBarPath,
      /import\s+\{.*ThemeToggle.*\}\s+from\s+["']@\/widgets\/theme-toggle["'];?/,
      opts,
    );
    // Remove <ThemeToggle /> usage
    await replaceInFile(
      topBarPath,
      /\s*<ThemeToggle\s*\/>\n?/g,
      "\n",
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // 5. Remove ThemeProvider from providers composition (src/app/providers.tsx)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing ThemeProvider from app providers...`);
  const appProvidersPath = path.resolve(projectRoot, "src/app/providers.tsx");
  if (await fileExists(appProvidersPath)) {
    await removeThemeFromAppProviders(appProvidersPath, opts);
  }

  // -------------------------------------------------------------------------
  // 6. Remove ThemeProvider export from shared/providers/index.ts
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing ThemeProvider from shared providers index...`);
  const sharedProvidersIndexPath = path.resolve(
    projectRoot,
    "src/shared/providers/index.ts",
  );
  if (await fileExists(sharedProvidersIndexPath)) {
    await removeLinesByPattern(
      sharedProvidersIndexPath,
      /export\s+\{.*ThemeProvider.*\}\s+from\s+["']\.\/theme-provider["'];?/,
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // 7. Remove suppressHydrationWarning from <html> tag in locale layout
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing suppressHydrationWarning from layout...`);
  const localeLayoutPath = path.resolve(
    projectRoot,
    "src/app/[locale]/layout.tsx",
  );
  if (await fileExists(localeLayoutPath)) {
    await replaceInFile(
      localeLayoutPath,
      /\s+suppressHydrationWarning/g,
      "",
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // 8. Remove next-themes from package.json
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing theme dependencies...`);
  const packageJsonPath = path.resolve(projectRoot, "package.json");
  await removeDependencyFromPackageJson(
    packageJsonPath,
    resolved.dependencies,
    opts,
  );

  // -------------------------------------------------------------------------
  // 9. Remove darkMode config from tailwind.config.ts
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing darkMode config from tailwind...`);
  const tailwindConfigPath = path.resolve(projectRoot, "tailwind.config.ts");
  if (await fileExists(tailwindConfigPath)) {
    // Remove the darkMode line (handles various formats like darkMode: ["class"] or darkMode: "class")
    await replaceInFile(
      tailwindConfigPath,
      /\s*darkMode:\s*\[?"class"?\]?,?\n/,
      "\n",
      opts,
    );
  }

  // -------------------------------------------------------------------------
  // 10. Remove theme translation keys from locale files
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing theme translation keys...`);
  const localeFiles = [
    path.resolve(projectRoot, "public/locales/ko/common.json"),
    path.resolve(projectRoot, "public/locales/en/common.json"),
  ];

  for (const localeFile of localeFiles) {
    await removeThemeTranslationKeys(localeFile, opts);
  }

  console.log(`${LOG_PREFIX.info} Theme module removal complete.\n`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove ThemeProvider import and JSX wrapping from the app providers file.
 *
 * Transforms:
 *   import { SWRProvider, ThemeProvider, AuthProvider, IntlProvider } from "@/shared/providers";
 *   ...
 *   <ThemeProvider>
 *     <AuthProvider>
 *       <SWRProvider>{children}</SWRProvider>
 *     </AuthProvider>
 *   </ThemeProvider>
 *
 * Into:
 *   import { SWRProvider, AuthProvider, IntlProvider } from "@/shared/providers";
 *   ...
 *   <AuthProvider>
 *     <SWRProvider>{children}</SWRProvider>
 *   </AuthProvider>
 */
async function removeThemeFromAppProviders(
  filePath: string,
  options: FileOperationOptions,
): Promise<void> {
  try {
    const content = await readFileContent(filePath);

    let updated = content;

    // Remove ThemeProvider from the import statement.
    // Handle both ", ThemeProvider" and "ThemeProvider, " patterns.
    updated = updated.replace(
      /,\s*ThemeProvider/g,
      "",
    );
    updated = updated.replace(
      /ThemeProvider\s*,\s*/g,
      "",
    );

    // Remove <ThemeProvider> opening tag and </ThemeProvider> closing tag,
    // but keep the children content between them.
    // Match opening tag with potential whitespace/newline
    updated = updated.replace(
      /\s*<ThemeProvider>\n/g,
      "\n",
    );
    // Match closing tag with potential whitespace/newline
    updated = updated.replace(
      /\s*<\/ThemeProvider>\n/g,
      "\n",
    );

    if (content === updated) {
      console.log(`  \u26A0 No ThemeProvider found in: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`  [dry-run] Would remove ThemeProvider from: ${filePath}`);
      return;
    }

    await writeFileContent(filePath, updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing ThemeProvider from providers: ${message}`);
  }
}

/**
 * Remove the top-level "theme" key and its entire object from a locale JSON file.
 */
async function removeThemeTranslationKeys(
  filePath: string,
  options: FileOperationOptions,
): Promise<void> {
  try {
    const exists = await fileExists(filePath);
    if (!exists) {
      console.log(`  \u26A0 Locale file not found: ${filePath}`);
      return;
    }

    const content = await readFileContent(filePath);
    const json = JSON.parse(content) as Record<string, unknown>;

    if (!("theme" in json)) {
      console.log(`  \u26A0 No "theme" key found in: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`  [dry-run] Would remove "theme" key from: ${filePath}`);
      return;
    }

    delete json.theme;
    await writeFileContent(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`  \u2713 Removed "theme" translations from: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing theme translations: ${message}`);
  }
}
