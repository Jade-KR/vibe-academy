import path from "node:path";

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

const MAGIC_LINK_LOG = {
  info: "  [magic-link]",
  step: "  [magic-link]",
} as const;

const OTP_LOG = {
  info: "  [otp]",
  step: "  [otp]",
} as const;

// ---------------------------------------------------------------------------
// Magic Link Removal
// ---------------------------------------------------------------------------

/**
 * Remove all magic-link-related files, directories, config sections,
 * barrel exports, types, validation schemas, navigation entries,
 * and translation keys from the project.
 *
 * This function is independent and can be called without removeOtp.
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function removeMagicLink(
  projectRoot: string,
  options?: FileOperationOptions,
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.magicLink, projectRoot);

  console.log(`\n${MAGIC_LINK_LOG.info} Starting magic-link module removal...`);

  // -------------------------------------------------------------------------
  // 1. Remove directories
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link directories...`);
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // -------------------------------------------------------------------------
  // 2. Remove individual files (email template, tests)
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link files...`);
  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // -------------------------------------------------------------------------
  // 3. Remove magic-link config from src/shared/config/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link config from auth.ts...`);
  const authConfigPath = path.resolve(projectRoot, "src/shared/config/auth.ts");
  await replaceInFile(
    authConfigPath,
    /\n\s*\/\*\* Magic link settings[^*]*\*\/\s*\n\s*magicLink:\s*\{[^}]*\},?\n/,
    "\n",
    opts,
  );

  // -------------------------------------------------------------------------
  // 4. Remove magic-link exports from src/features/auth/index.ts
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link barrel exports...`);
  const authBarrelPath = path.resolve(projectRoot, "src/features/auth/index.ts");
  await removeLinesByPattern(authBarrelPath, /magic-link|MagicLink|useMagicLink/, opts);

  // -------------------------------------------------------------------------
  // 5. Remove magic-link types from src/shared/types/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link types...`);
  const authTypesPath = path.resolve(projectRoot, "src/shared/types/auth.ts");
  await replaceInFile(
    authTypesPath,
    /\nexport interface MagicLinkRequest\s*\{[^}]*\}\n/,
    "\n",
    opts,
  );

  // Also remove MagicLinkRequest from the AuthRequest union type
  await replaceInFile(authTypesPath, /\s*\|\s*MagicLinkRequest/, "", opts);

  // -------------------------------------------------------------------------
  // 6. Remove magic-link re-export from src/shared/types/index.ts
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link type re-exports...`);
  const typesIndexPath = path.resolve(projectRoot, "src/shared/types/index.ts");
  await removeLinesByPattern(typesIndexPath, /MagicLinkRequest/, opts);

  // -------------------------------------------------------------------------
  // 7. Remove magic-link validation schemas from validations/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link validation schemas...`);
  const validationsPath = path.resolve(projectRoot, "src/shared/lib/validations/auth.ts");
  await replaceInFile(
    validationsPath,
    /\n\/\*\*\s*\n\s*\*\s*POST \/api\/auth\/magic-link\s*\n\s*\*\/\s*\nexport const magicLinkSchema\s*=\s*z\.object\(\{[^}]*\}\);\n/,
    "\n",
    opts,
  );

  // -------------------------------------------------------------------------
  // 8. Update navigation.ts to remove magic-link from authOnlyRoutes
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link from navigation config...`);
  const navigationPath = path.resolve(projectRoot, "src/shared/config/navigation.ts");
  await replaceInFile(navigationPath, /\s*"\/magic-link",?\n/, "\n", opts);

  // -------------------------------------------------------------------------
  // 9. Remove magic-link from middleware AUTH_ROUTES
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link from middleware...`);
  const middlewarePath = path.resolve(projectRoot, "src/middleware.ts");
  await replaceInFile(middlewarePath, /\s*"\/magic-link",?\n/, "\n", opts);

  // -------------------------------------------------------------------------
  // 10. Remove magic-link translation keys from locale files
  // -------------------------------------------------------------------------
  console.log(`${MAGIC_LINK_LOG.step} Removing magic-link translation keys...`);
  const localeFiles = [
    path.resolve(projectRoot, "public/locales/ko/common.json"),
    path.resolve(projectRoot, "public/locales/en/common.json"),
  ];

  for (const localeFile of localeFiles) {
    await removeAuthTranslationSection(localeFile, "magicLink", opts);
  }

  console.log(`${MAGIC_LINK_LOG.info} Magic-link module removal complete.\n`);
}

// ---------------------------------------------------------------------------
// OTP Removal
// ---------------------------------------------------------------------------

/**
 * Remove all OTP-related files, directories, config sections,
 * barrel exports, types, validation schemas, navigation entries,
 * and translation keys from the project.
 *
 * This function is independent and can be called without removeMagicLink.
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function removeOtp(
  projectRoot: string,
  options?: FileOperationOptions,
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.otp, projectRoot);

  console.log(`\n${OTP_LOG.info} Starting OTP module removal...`);

  // -------------------------------------------------------------------------
  // 1. Remove directories
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP directories...`);
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // -------------------------------------------------------------------------
  // 2. Remove individual files (email template, tests)
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP files...`);
  for (const file of resolved.files) {
    await removeFile(file, opts);
  }

  // -------------------------------------------------------------------------
  // 3. Remove OTP config from src/shared/config/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP config from auth.ts...`);
  const authConfigPath = path.resolve(projectRoot, "src/shared/config/auth.ts");
  await replaceInFile(
    authConfigPath,
    /\n\s*\/\*\* OTP settings[^*]*\*\/\s*\n\s*otp:\s*\{[^}]*\},?\n/,
    "\n",
    opts,
  );

  // -------------------------------------------------------------------------
  // 4. Remove OTP exports from src/features/auth/index.ts
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP barrel exports...`);
  const authBarrelPath = path.resolve(projectRoot, "src/features/auth/index.ts");
  await removeLinesByPattern(authBarrelPath, /["']\.\/otp["']|OTPForm|OtpForm|useOtp/, opts);

  // -------------------------------------------------------------------------
  // 5. Remove OTP types from src/shared/types/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP types...`);
  const authTypesPath = path.resolve(projectRoot, "src/shared/types/auth.ts");
  await replaceInFile(authTypesPath, /\nexport interface OtpSendRequest\s*\{[^}]*\}\n/, "\n", opts);
  await replaceInFile(
    authTypesPath,
    /\nexport interface OtpVerifyRequest\s*\{[^}]*\}\n/,
    "\n",
    opts,
  );

  // Remove OTP types from the AuthRequest union type
  await replaceInFile(authTypesPath, /\s*\|\s*OtpSendRequest/, "", opts);
  await replaceInFile(authTypesPath, /\s*\|\s*OtpVerifyRequest/, "", opts);

  // -------------------------------------------------------------------------
  // 6. Remove OTP re-exports from src/shared/types/index.ts
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP type re-exports...`);
  const typesIndexPath = path.resolve(projectRoot, "src/shared/types/index.ts");
  await removeLinesByPattern(typesIndexPath, /OtpSendRequest|OtpVerifyRequest/, opts);

  // -------------------------------------------------------------------------
  // 7. Remove OTP validation schemas from validations/auth.ts
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP validation schemas...`);
  const validationsPath = path.resolve(projectRoot, "src/shared/lib/validations/auth.ts");
  // Remove otpSendSchema
  await replaceInFile(
    validationsPath,
    /\n\/\*\*\s*\n\s*\*\s*POST \/api\/auth\/otp\/send\s*\n\s*\*\/\s*\nexport const otpSendSchema\s*=\s*z\.object\(\{[^}]*\}\);\n/,
    "\n",
    opts,
  );
  // Remove otpVerifySchema (multi-line with chained methods)
  await replaceInFile(
    validationsPath,
    /\n\/\*\*\s*\n\s*\*\s*POST \/api\/auth\/otp\/verify\s*\n\s*\*\/\s*\nexport const otpVerifySchema\s*=\s*z\.object\(\{[\s\S]*?\}\);\n/,
    "\n",
    opts,
  );

  // -------------------------------------------------------------------------
  // 8. Update navigation.ts to remove OTP from authOnlyRoutes
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP from navigation config...`);
  const navigationPath = path.resolve(projectRoot, "src/shared/config/navigation.ts");
  await replaceInFile(navigationPath, /\s*"\/otp",?\n/, "\n", opts);

  // -------------------------------------------------------------------------
  // 9. Remove OTP from middleware AUTH_ROUTES
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP from middleware...`);
  const middlewarePath = path.resolve(projectRoot, "src/middleware.ts");
  await replaceInFile(middlewarePath, /\s*"\/otp",?\n/, "\n", opts);

  // -------------------------------------------------------------------------
  // 10. Remove OTP translation keys from locale files
  // -------------------------------------------------------------------------
  console.log(`${OTP_LOG.step} Removing OTP translation keys...`);
  const localeFiles = [
    path.resolve(projectRoot, "public/locales/ko/common.json"),
    path.resolve(projectRoot, "public/locales/en/common.json"),
  ];

  for (const localeFile of localeFiles) {
    await removeAuthTranslationSection(localeFile, "otp", opts);
  }

  console.log(`${OTP_LOG.info} OTP module removal complete.\n`);
}

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

/**
 * Remove a nested key from the "auth" section of a locale JSON file.
 * For example, removeAuthTranslationSection(file, "magicLink") removes
 * the entire json.auth.magicLink object.
 */
async function removeAuthTranslationSection(
  filePath: string,
  sectionKey: string,
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

    const auth = json.auth as Record<string, unknown> | undefined;
    if (!auth || !(sectionKey in auth)) {
      console.log(`  \u26A0 No "auth.${sectionKey}" key found in: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`  [dry-run] Would remove "auth.${sectionKey}" key from: ${filePath}`);
      return;
    }

    delete auth[sectionKey];
    await writeFileContent(filePath, JSON.stringify(json, null, 2) + "\n");
    console.log(`  \u2713 Removed "auth.${sectionKey}" translations from: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  \u26A0 Error removing auth.${sectionKey} translations: ${message}`);
  }
}
