import path from "node:path";

import {
  type FileOperationOptions,
  fileExists,
  readFileContent,
  removeDirectory,
  removeFile,
  removeDependencyFromPackageJson,
  replaceInFile,
  writeFileContent,
} from "../file-operations";
import { MODULE_MAP, resolveModulePaths } from "../module-map";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_PREFIX = {
  info: "  [blog]",
  step: "  [blog]",
} as const;

/**
 * Dependencies that are shared with legal pages (MDX rendering).
 * These should NOT be removed if legal content still exists.
 */
const SHARED_MDX_DEPENDENCIES = ["next-mdx-remote"];

/**
 * Blog-only dependencies safe to remove unconditionally.
 */
const BLOG_ONLY_DEPENDENCIES = ["gray-matter", "reading-time"];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Remove all blog-related files, directories, dependencies, and references
 * from the project. Preserves shared MDX dependencies if legal pages exist.
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function removeBlog(
  projectRoot: string,
  options?: FileOperationOptions,
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.blog, projectRoot);

  console.log(`\n${LOG_PREFIX.info} Starting blog module removal...`);

  // -------------------------------------------------------------------------
  // 1. Remove directories
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing blog directories...`);
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // -------------------------------------------------------------------------
  // 2. Remove individual files
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing blog files...`);
  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // -------------------------------------------------------------------------
  // 3. Remove blog entry from navigation config
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing blog from navigation config...`);
  const navigationPath = path.resolve(
    projectRoot,
    "src/shared/config/navigation.ts",
  );
  await replaceInFile(
    navigationPath,
    /\s*\{\s*key:\s*"blog",\s*href:\s*"\/blog",\s*labelKey:\s*"nav\.blog"\s*\},?\n?/,
    "\n",
    opts,
  );

  // -------------------------------------------------------------------------
  // 4. Remove blog translation keys from locale files
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing blog translation keys...`);
  const localeFiles = [
    path.resolve(projectRoot, "public/locales/ko/common.json"),
    path.resolve(projectRoot, "public/locales/en/common.json"),
  ];

  for (const localeFile of localeFiles) {
    await removeBlogTranslationKeys(localeFile, opts);
  }

  // Remove "blog" key from nav translations
  for (const localeFile of localeFiles) {
    await removeBlogNavTranslationKey(localeFile, opts);
  }

  // -------------------------------------------------------------------------
  // 5. Remove blog dependencies from package.json
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing blog dependencies...`);
  const packageJsonPath = path.resolve(projectRoot, "package.json");

  // Always remove blog-only deps
  await removeDependencyFromPackageJson(
    packageJsonPath,
    BLOG_ONLY_DEPENDENCIES,
    opts,
  );

  // Check if legal pages still need MDX before removing shared deps
  const legalContentDir = path.resolve(projectRoot, "src/content/legal");
  const legalExists = await fileExists(legalContentDir);

  if (legalExists) {
    console.log(
      `${LOG_PREFIX.info} Legal content exists — keeping next-mdx-remote`,
    );
  } else {
    await removeDependencyFromPackageJson(
      packageJsonPath,
      SHARED_MDX_DEPENDENCIES,
      opts,
    );
  }

  console.log(`${LOG_PREFIX.info} Blog module removal complete.\n`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove the top-level "blog" key and its entire object from a locale JSON file.
 */
async function removeBlogTranslationKeys(
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

    if (!("blog" in json)) {
      console.log(`  \u26A0 No "blog" key found in: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`  [dry-run] Would remove "blog" key from: ${filePath}`);
      return;
    }

    delete json.blog;
    await writeFileContent(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`  \u2713 Removed "blog" translations from: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing blog translations: ${message}`);
  }
}

/**
 * Remove the "blog" key from the "nav" section of a locale JSON file.
 */
async function removeBlogNavTranslationKey(
  filePath: string,
  options: FileOperationOptions,
): Promise<void> {
  try {
    const exists = await fileExists(filePath);
    if (!exists) return;

    const content = await readFileContent(filePath);
    const json = JSON.parse(content) as Record<string, unknown>;

    const nav = json.nav as Record<string, unknown> | undefined;
    if (!nav || !("blog" in nav)) {
      console.log(`  \u26A0 No "nav.blog" key found in: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`  [dry-run] Would remove "nav.blog" key from: ${filePath}`);
      return;
    }

    delete nav.blog;
    await writeFileContent(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`  \u2713 Removed "nav.blog" key from: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing nav.blog key: ${message}`);
  }
}
