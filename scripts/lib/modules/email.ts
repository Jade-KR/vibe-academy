import path from "node:path";

import {
  type FileOperationOptions,
  fileExists,
  readFileContent,
  removeDirectory,
  removeFile,
  removeDependencyFromPackageJson,
  removeScriptFromPackageJson,
  removeLinesByPattern,
  replaceInFile,
  writeFileContent,
} from "../file-operations";
import { MODULE_MAP, resolveModulePaths } from "../module-map";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_PREFIX = {
  info: "  [email]",
  step: "  [email]",
} as const;

/**
 * Mapping of files that import from `@/shared/api/resend` and the
 * replacement strategy for each.  The key is relative to projectRoot.
 *
 * Each entry describes:
 *   - `importLines`: regex to match import statements to remove
 *   - `replacements`: array of { search, replace } pairs that swap
 *     the sendEmail call for a console.log fallback
 */
interface EmailCallSite {
  relativePath: string;
  importLines: RegExp;
  replacements: Array<{ search: string | RegExp; replace: string }>;
}

const EMAIL_CALL_SITES: EmailCallSite[] = [
  // 1. Registration route — sends WelcomeEmail
  {
    relativePath: "src/app/api/auth/register/route.ts",
    importLines: /^import\s+\{[^}]*\}\s+from\s+["']@\/shared\/api\/resend(?:\/[^"']*)?["'];?\s*$/gm,
    replacements: [
      {
        search:
          /\/\/ 4\. Send welcome email \(fire-and-forget\)\n\s+sendEmail\(\{[\s\S]*?\}\)\.catch\(\(err\) => \{[\s\S]*?\}\);/,
        replace: `// 4. Welcome email (disabled — Resend removed)
    console.log(\`[Email disabled] welcome-email: would send to \${dbUser.email}\`);`,
      },
    ],
  },

  // 2. Payment webhook — sends SubscriptionEmail
  {
    relativePath: "src/app/api/payments/webhook/route.ts",
    importLines: /^import\s+\{[^}]*\}\s+from\s+["']@\/shared\/api\/resend(?:\/[^"']*)?["'];?\s*$/gm,
    replacements: [
      {
        search:
          /\/\/ Send subscription confirmation email \(fire-and-forget\)\n\s+try \{[\s\S]*?const \[user\] = await db\.select\(\)\.from\(users\)\.where\(eq\(users\.id, userId\)\)\.limit\(1\);\n\s+if \(user\) \{[\s\S]*?sendEmail\(\{[\s\S]*?\}\)\.catch\(\(err\) => \{[\s\S]*?\}\);\n\s+\}\n\s+\} catch \(emailErr\) \{[\s\S]*?\}/,
        replace: `// Subscription confirmation email (disabled — Resend removed)
    console.log(\`[Email disabled] subscription-email: would send to userId=\${userId}, plan=\${metadata?.planId ?? "unknown"}\`);`,
      },
    ],
  },
];

/**
 * Env-var section in .env.example to remove (including comments / header).
 */
const ENV_SECTION_REGEX =
  /# -{2,}\n# Resend \(Email\)\n# -{2,}\n(?:(?:RESEND_[A-Z_]+=.*|#[^\n]*)\n?)*/;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Remove all email / Resend-related files, directories, dependencies,
 * env vars, scripts, and inline sendEmail calls from the project.
 *
 * Auth routes that rely on Supabase-native email (forgot-password,
 * magic-link, otp) are NOT touched — only direct `sendEmail()` calls
 * via `@/shared/api/resend` are replaced with console.log fallbacks.
 *
 * @param projectRoot - Absolute path to the project root directory
 * @param options - Optional settings (e.g., dryRun mode)
 */
export async function removeEmail(
  projectRoot: string,
  options?: FileOperationOptions,
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };
  const resolved = resolveModulePaths(MODULE_MAP.email, projectRoot);

  console.log(`\n${LOG_PREFIX.info} Starting email/Resend module removal...`);

  // -------------------------------------------------------------------------
  // 1. Replace email sending calls with console.log fallbacks
  //    (must happen BEFORE removing the resend directory so the files
  //     being patched still have valid imports during dry-run inspection)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Replacing email send calls with console.log fallbacks...`);
  for (const site of EMAIL_CALL_SITES) {
    const absPath = path.resolve(projectRoot, site.relativePath);
    const exists = await fileExists(absPath);
    if (!exists) {
      console.log(`  \u26A0 File not found (skipping): ${site.relativePath}`);
      continue;
    }

    // Remove import lines for @/shared/api/resend
    await replaceInFile(absPath, site.importLines, "", opts);

    // Replace each sendEmail call site
    for (const { search, replace } of site.replacements) {
      await replaceInFile(absPath, search, replace, opts);
    }
  }

  // Also clean up unused `siteConfig` import in register route if it was
  // only used for the email subject/body (it's still used in the response
  // message, so check before removing).
  await cleanupUnusedImportsInRegisterRoute(projectRoot, opts);

  // -------------------------------------------------------------------------
  // 2. Remove resend directories (src/shared/api/resend, tests)
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing resend directories...`);
  for (const dir of resolved.directories) {
    await removeDirectory(dir, opts);
  }

  // -------------------------------------------------------------------------
  // 3. Remove individual files listed in MODULE_MAP
  // -------------------------------------------------------------------------
  if (resolved.files.length > 0) {
    console.log(`${LOG_PREFIX.step} Removing individual email files...`);
    for (const file of resolved.files) {
      await removeFile(file, opts);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Remove email dependencies from package.json
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing email dependencies...`);
  const packageJsonPath = path.resolve(projectRoot, "package.json");
  await removeDependencyFromPackageJson(packageJsonPath, resolved.dependencies, opts);

  // -------------------------------------------------------------------------
  // 5. Remove email:dev script from package.json
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing email scripts...`);
  await removeScriptFromPackageJson(packageJsonPath, resolved.scripts, opts);

  // -------------------------------------------------------------------------
  // 6. Remove RESEND_* environment variables from .env.example
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Removing RESEND env vars from .env.example...`);
  const envExamplePath = path.resolve(projectRoot, ".env.example");
  await removeResendEnvSection(envExamplePath, opts);

  // -------------------------------------------------------------------------
  // 7. Clean up test files that mock @/shared/api/resend
  // -------------------------------------------------------------------------
  console.log(`${LOG_PREFIX.step} Cleaning up test mocks for resend...`);
  await cleanupTestResendMocks(projectRoot, opts);

  console.log(`${LOG_PREFIX.info} Email/Resend module removal complete.\n`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove the entire "# Resend (Email)" section from .env.example,
 * including the header comments and RESEND_* variable lines.
 *
 * Falls back to line-by-line removal if the section regex doesn't match
 * (e.g. if formatting has changed).
 */
async function removeResendEnvSection(
  envExamplePath: string,
  options: FileOperationOptions,
): Promise<void> {
  const exists = await fileExists(envExamplePath);
  if (!exists) {
    console.log(`  \u26A0 .env.example not found: ${envExamplePath}`);
    return;
  }

  // Try section-level removal first
  const sectionReplaced = await replaceInFile(envExamplePath, ENV_SECTION_REGEX, "", options);

  if (!sectionReplaced) {
    // Fallback: remove individual RESEND_* lines
    await removeLinesByPattern(envExamplePath, /^RESEND_/i, options);
  }

  // Clean up any resulting double blank lines
  if (!options.dryRun) {
    try {
      const content = await readFileContent(envExamplePath);
      const cleaned = content.replace(/\n{3,}/g, "\n\n");
      if (cleaned !== content) {
        await writeFileContent(envExamplePath, cleaned, { dryRun: false });
      }
    } catch {
      // Non-critical — ignore
    }
  }
}

/**
 * After removing the email imports/calls from the register route,
 * check if `siteConfig` is still referenced. If `WelcomeEmail` was
 * the only consumer, the import of `siteConfig` may now only appear
 * in the success response message — keep it in that case.
 */
async function cleanupUnusedImportsInRegisterRoute(
  projectRoot: string,
  options: FileOperationOptions,
): Promise<void> {
  const routePath = path.resolve(projectRoot, "src/app/api/auth/register/route.ts");
  const exists = await fileExists(routePath);
  if (!exists) return;

  try {
    const content = await readFileContent(routePath);

    // Count how many times siteConfig is referenced (excluding its own import)
    const importLine =
      /^import\s+\{[^}]*siteConfig[^}]*\}\s+from\s+["']@\/shared\/config\/site["'];?\s*$/m;
    const contentWithoutImport = content.replace(importLine, "");
    const usageCount = (contentWithoutImport.match(/siteConfig/g) || []).length;

    if (usageCount === 0) {
      // siteConfig is no longer used — remove the import
      await replaceInFile(routePath, importLine, "", options);
    }
  } catch {
    // Non-critical — skip
  }
}

/**
 * Clean up vi.mock calls for @/shared/api/resend in test files.
 *
 * For the register test: remove the sendEmail mock, WelcomeEmail mock,
 * and email-specific test cases.
 *
 * For the webhook test: remove the sendEmail mock, SubscriptionEmail mock,
 * and email-specific test cases.
 */
async function cleanupTestResendMocks(
  projectRoot: string,
  options: FileOperationOptions,
): Promise<void> {
  const testFiles = [
    "src/__tests__/api/auth/register.test.ts",
    "src/__tests__/api/payments/webhook.test.ts",
  ];

  for (const relPath of testFiles) {
    const absPath = path.resolve(projectRoot, relPath);
    const exists = await fileExists(absPath);
    if (!exists) {
      console.log(`  \u26A0 Test file not found (skipping): ${relPath}`);
      continue;
    }

    try {
      const content = await readFileContent(absPath);

      // Remove vi.mock("@/shared/api/resend", ...) blocks
      let updated = content.replace(/const mockSendEmail = vi\.fn\(\)[^;]*;\n/g, "");
      updated = updated.replace(
        /vi\.mock\(["']@\/shared\/api\/resend["'],\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);\n\n?/g,
        "",
      );
      updated = updated.replace(
        /vi\.mock\(["']@\/shared\/api\/resend\/templates\/[^"']*["'],\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\);\n\n?/g,
        "",
      );

      if (content !== updated) {
        if (options.dryRun) {
          console.log(`  [dry-run] Would clean up resend mocks in: ${relPath}`);
        } else {
          await writeFileContent(absPath, updated, { dryRun: false });
          console.log(`  \u2713 Cleaned up resend mocks in: ${relPath}`);
        }
      } else {
        console.log(`  \u26A0 No resend mocks found in: ${relPath}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  \u26A0 Error cleaning test file ${relPath}: ${message}`);
    }
  }
}
