import path from "node:path";

import type { AuthMethod } from "../types";
import { OAUTH_PROVIDERS } from "../types";
import { MODULE_MAP, resolveModulePaths } from "../module-map";
import {
  removeDirectory,
  removeFile,
  replaceInFile,
  removeLinesByPattern,
  readFileContent,
  writeFileContent,
  fileExists,
  type FileOperationOptions,
} from "../file-operations";

// ---------------------------------------------------------------------------
// Provider → env-var-prefix mapping
// ---------------------------------------------------------------------------

/**
 * Maps each OAuth provider to its environment variable prefixes.
 * These prefixes are used to match and remove lines from .env.example.
 * Apple uses non-standard var names (SERVICE_ID, KEY_ID, TEAM_ID, PRIVATE_KEY)
 * so we match on the `APPLE_` prefix broadly.
 */
const PROVIDER_ENV_PREFIXES: Record<string, string[]> = {
  google: ["GOOGLE_"],
  github: ["GITHUB_"],
  kakao: ["KAKAO_"],
  naver: ["NAVER_"],
  apple: ["APPLE_"],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Configure authentication by removing deselected OAuth providers.
 *
 * **Scenario A** — Some OAuth providers selected (partial removal):
 *   1. Update `src/shared/config/auth.ts` — remove deselected providers from the providers array
 *   2. Update `src/features/auth/social-login/config/providers.ts` — remove deselected provider configs
 *   3. Remove deselected provider env vars from `.env.example`
 *
 * **Scenario B** — No OAuth providers selected (full social removal):
 *   1. Remove entire `features/auth/social-login/` directory
 *   2. Remove `app/api/auth/social/` and `app/api/auth/callback/` routes
 *   3. Remove SocialLoginButtons imports/usage from login-form.tsx and register-form.tsx
 *   4. Remove social login exports from `features/auth/index.ts`
 *   5. Clean up `auth.ts` config (remove providers section)
 *   6. Remove ALL OAuth env vars from `.env.example`
 */
export async function configureAuth(
  projectRoot: string,
  selectedAuthMethods: AuthMethod[],
  options?: { dryRun?: boolean },
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun };

  const selectedOAuthProviders = selectedAuthMethods.filter((m) =>
    (OAUTH_PROVIDERS as string[]).includes(m),
  );

  const hasAnyOAuth = selectedOAuthProviders.length > 0;

  if (hasAnyOAuth) {
    console.log("\n[Auth] Scenario A: partial OAuth removal");
    await handlePartialOAuthRemoval(projectRoot, selectedOAuthProviders, opts);
  } else {
    console.log("\n[Auth] Scenario B: full social login removal");
    await handleFullSocialRemoval(projectRoot, opts);
  }
}

// ---------------------------------------------------------------------------
// Scenario A — Partial OAuth removal
// ---------------------------------------------------------------------------

async function handlePartialOAuthRemoval(
  projectRoot: string,
  selectedProviders: AuthMethod[],
  opts: FileOperationOptions,
): Promise<void> {
  const deselected = OAUTH_PROVIDERS.filter((p) => !selectedProviders.includes(p));

  if (deselected.length === 0) {
    console.log("  All OAuth providers selected — nothing to remove.");
    return;
  }

  console.log(`  Keeping: ${selectedProviders.join(", ")}`);
  console.log(`  Removing: ${deselected.join(", ")}`);

  // 1. Update src/shared/config/auth.ts — remove deselected from providers array
  await updateAuthConfig(projectRoot, selectedProviders, opts);

  // 2. Update src/features/auth/social-login/config/providers.ts — remove deselected entries
  await updateProviderConfigs(projectRoot, selectedProviders, opts);

  // 3. Remove deselected provider env vars from .env.example
  await removeProviderEnvVars(projectRoot, deselected, opts);
}

/**
 * Rewrite the `providers` array in authConfig to only include selected providers.
 */
async function updateAuthConfig(
  projectRoot: string,
  selectedProviders: AuthMethod[],
  opts: FileOperationOptions,
): Promise<void> {
  const filePath = path.resolve(projectRoot, "src/shared/config/auth.ts");

  if (!(await fileExists(filePath))) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  // Match the entire providers array declaration (multiline)
  const providersArrayRe =
    /providers:\s*\[[\s\S]*?\]\s*as\s*const\s*satisfies\s*readonly\s*SocialProvider\[\]/;

  const providerItems = selectedProviders.map((p) => `    "${p}"`).join(",\n");

  const replacement = `providers: [\n${providerItems},\n  ] as const satisfies readonly SocialProvider[]`;

  await replaceInFile(filePath, providersArrayRe, replacement, opts);
}

/**
 * Rewrite `PROVIDER_CONFIGS` in providers.ts to only include selected providers.
 */
async function updateProviderConfigs(
  projectRoot: string,
  selectedProviders: AuthMethod[],
  opts: FileOperationOptions,
): Promise<void> {
  const filePath = path.resolve(projectRoot, "src/features/auth/social-login/config/providers.ts");

  if (!(await fileExists(filePath))) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  const content = await readFileContent(filePath);

  // Parse the existing PROVIDER_CONFIGS entries so we preserve their original
  // className values exactly. We match individual object entries within the array.
  const entryRe = /\{\s*id:\s*"(\w+)"[^}]*\}/g;

  let match: RegExpExecArray | null;
  const entries: { id: string; full: string }[] = [];
  while ((match = entryRe.exec(content)) !== null) {
    entries.push({ id: match[1], full: match[0] });
  }

  const kept = entries.filter((e) => (selectedProviders as string[]).includes(e.id));

  const newArray = `export const PROVIDER_CONFIGS: ProviderDisplayConfig[] = [\n${kept
    .map((e) => `  ${e.full}`)
    .join(",\n")},\n];`;

  // Replace the entire PROVIDER_CONFIGS declaration
  const configsArrayRe =
    /export\s+const\s+PROVIDER_CONFIGS:\s*ProviderDisplayConfig\[\]\s*=\s*\[[\s\S]*?\];/;

  const updated = content.replace(configsArrayRe, newArray);

  if (updated === content) {
    console.log(`  ⚠ No match for PROVIDER_CONFIGS in: ${filePath}`);
    return;
  }

  await writeFileContent(filePath, updated, opts);
}

/**
 * Remove environment variable lines for deselected OAuth providers from .env.example.
 * Also removes associated comment lines (e.g. "# Google OAuth").
 */
async function removeProviderEnvVars(
  projectRoot: string,
  deselectedProviders: AuthMethod[],
  opts: FileOperationOptions,
): Promise<void> {
  const envPath = path.resolve(projectRoot, ".env.example");

  if (!(await fileExists(envPath))) {
    console.log(`  ⚠ File not found: ${envPath}`);
    return;
  }

  const prefixes = deselectedProviders.flatMap((p) => PROVIDER_ENV_PREFIXES[p] ?? []);

  if (prefixes.length === 0) return;

  const content = await readFileContent(envPath);
  const lines = content.split("\n");
  const filtered: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this line is an env var belonging to a deselected provider
    const isDeselectedEnvVar = prefixes.some((prefix) => trimmed.startsWith(prefix));

    if (isDeselectedEnvVar) {
      // Also check if previous line is a comment for this provider, and remove it
      if (
        filtered.length > 0 &&
        filtered[filtered.length - 1].trim().startsWith("#") &&
        !filtered[filtered.length - 1].trim().startsWith("# ---")
      ) {
        filtered.pop();
      }
      continue;
    }

    filtered.push(line);
  }

  // Clean up double blank lines left by removals
  const cleaned = collapseBlankLines(filtered.join("\n"));

  await writeFileContent(envPath, cleaned, opts);
}

// ---------------------------------------------------------------------------
// Scenario B — Full social login removal
// ---------------------------------------------------------------------------

async function handleFullSocialRemoval(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  // 1. Remove entire social-login directory and API routes using MODULE_MAP
  const socialModule = resolveModulePaths(MODULE_MAP.socialLogin, projectRoot);

  for (const dir of socialModule.directories) {
    await removeDirectory(dir, opts);
  }

  for (const file of socialModule.files) {
    await removeFile(file, opts);
  }

  // Also remove the callback route directory
  const callbackDir = path.resolve(projectRoot, "src/app/api/auth/callback");
  await removeDirectory(callbackDir, opts);

  // Also remove the social API route directory
  const socialApiDir = path.resolve(projectRoot, "src/app/api/auth/social");
  await removeDirectory(socialApiDir, opts);

  // 2. Remove SocialLoginButtons import and usage from login-form.tsx
  await removeSocialLoginFromForm(
    path.resolve(projectRoot, "src/features/auth/login/ui/login-form.tsx"),
    opts,
  );

  // 3. Remove SocialLoginButtons import and usage from register-form.tsx
  await removeSocialLoginFromForm(
    path.resolve(projectRoot, "src/features/auth/register/ui/register-form.tsx"),
    opts,
  );

  // 4. Remove social login exports from features/auth/index.ts
  await removeSocialExportsFromBarrel(
    path.resolve(projectRoot, "src/features/auth/index.ts"),
    opts,
  );

  // 5. Clean up auth.ts config — remove providers section
  await removeProvidersFromAuthConfig(path.resolve(projectRoot, "src/shared/config/auth.ts"), opts);

  // 6. Remove ALL OAuth env vars from .env.example
  await removeAllOAuthEnvVars(projectRoot, opts);
}

/**
 * Remove the SocialLoginButtons import line and its JSX usage from a form component.
 */
async function removeSocialLoginFromForm(
  filePath: string,
  opts: FileOperationOptions,
): Promise<void> {
  if (!(await fileExists(filePath))) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  let content = await readFileContent(filePath);

  // Remove import line
  content = content.replace(
    /import\s*\{[^}]*SocialLoginButtons[^}]*\}\s*from\s*["'][^"']*["'];\s*\n/g,
    "",
  );

  // Remove JSX usage — matches <SocialLoginButtons ... /> with any props on one line
  content = content.replace(/\s*<SocialLoginButtons[^/>]*\/>\s*\n?/g, "\n");

  await writeFileContent(filePath, content, opts);
}

/**
 * Remove all social-login-related export lines from the auth barrel file.
 */
async function removeSocialExportsFromBarrel(
  filePath: string,
  opts: FileOperationOptions,
): Promise<void> {
  if (!(await fileExists(filePath))) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  // Remove lines that export from "./social-login"
  await removeLinesByPattern(filePath, /from\s+["']\.\/social-login["']/, opts);
}

/**
 * Remove the `providers` key entirely from authConfig in auth.ts.
 */
async function removeProvidersFromAuthConfig(
  filePath: string,
  opts: FileOperationOptions,
): Promise<void> {
  if (!(await fileExists(filePath))) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return;
  }

  let content = await readFileContent(filePath);

  // Remove the providers property including its inline JSDoc comment.
  // We match an optional JSDoc comment (/** ... */) that appears immediately
  // before the `providers:` key. We use a two-step approach to avoid accidentally
  // matching earlier JSDoc blocks in the file.
  //
  // Step 1: Remove the providers array line(s) themselves
  content = content.replace(
    /\n[ \t]*\/\*\*[^*]*(?:\*(?!\/)[^*]*)*\*\/\s*\n?[ \t]*providers:\s*\[[\s\S]*?\]\s*as\s*const\s*satisfies\s*readonly\s*SocialProvider\[\],?/,
    "",
  );
  // If the JSDoc was not present or the above didn't match, try without JSDoc
  content = content.replace(
    /\n[ \t]*providers:\s*\[[\s\S]*?\]\s*as\s*const\s*satisfies\s*readonly\s*SocialProvider\[\],?/,
    "",
  );

  // Remove the SocialProvider import if it's no longer referenced
  if (!content.includes("SocialProvider")) {
    content = content.replace(
      /import\s+type\s*\{\s*SocialProvider\s*\}\s*from\s*["'][^"']*["'];\s*\n?/,
      "",
    );
  }

  await writeFileContent(filePath, content, opts);
}

/**
 * Remove the entire "OAuth Providers" section from .env.example,
 * including all provider env vars and the section header/comments.
 */
async function removeAllOAuthEnvVars(
  projectRoot: string,
  opts: FileOperationOptions,
): Promise<void> {
  const envPath = path.resolve(projectRoot, ".env.example");

  if (!(await fileExists(envPath))) {
    console.log(`  ⚠ File not found: ${envPath}`);
    return;
  }

  const content = await readFileContent(envPath);
  const lines = content.split("\n");
  const filtered: string[] = [];
  let skipUntilNextSection = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Detect the 3-line OAuth section header:
    //   # ---...
    //   # OAuth Providers...
    //   # ---...
    if (
      !skipUntilNextSection &&
      trimmed.startsWith("# ---") &&
      lines[i + 1]?.trim().startsWith("# OAuth Providers")
    ) {
      // Skip the header (3 lines) and all content until next section
      skipUntilNextSection = true;
      i += 2; // skip title line and closing dash line
      continue;
    }

    if (skipUntilNextSection) {
      // A new section starts with "# ---" separator
      if (trimmed.startsWith("# ---")) {
        skipUntilNextSection = false;
        filtered.push(lines[i]);
        continue;
      }
      // Otherwise skip this line (still inside OAuth section)
      continue;
    }

    filtered.push(lines[i]);
  }

  let updated = filtered.join("\n");

  // Clean up double blank lines
  updated = collapseBlankLines(updated);

  await writeFileContent(envPath, updated, opts);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Collapse 3+ consecutive newlines into 2 (one blank line).
 */
function collapseBlankLines(content: string): string {
  return content.replace(/\n{3,}/g, "\n\n");
}
