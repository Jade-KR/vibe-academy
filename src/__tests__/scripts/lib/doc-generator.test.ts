import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { generateDocs } from "../../../../scripts/lib/doc-generator";
import type { SetupConfig } from "../../../../scripts/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Full-featured config with all options enabled */
function fullConfig(overrides: Partial<SetupConfig> = {}): SetupConfig {
  return {
    projectName: "my-saas",
    authMethods: ["email-password", "google", "github"],
    payments: true,
    locale: "both",
    darkMode: true,
    email: true,
    blog: true,
    ...overrides,
  };
}

/** Minimal config with everything disabled */
function minimalConfig(overrides: Partial<SetupConfig> = {}): SetupConfig {
  return {
    projectName: "bare-app",
    authMethods: ["email-password"],
    payments: false,
    locale: "ko",
    darkMode: false,
    email: false,
    blog: false,
    ...overrides,
  };
}

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vibepack-docgen-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateDocs", () => {
  // -----------------------------------------------------------------------
  // vibepack.config.json
  // -----------------------------------------------------------------------
  describe("vibepack.config.json", () => {
    it("generates config json with all features recorded", async () => {
      const config = fullConfig();
      await generateDocs(config, tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "vibepack.config.json"),
        "utf-8",
      );
      const parsed = JSON.parse(content);

      expect(parsed.projectName).toBe("my-saas");
      expect(parsed.generatedAt).toBeDefined();
      expect(parsed.features.auth).toEqual([
        "email-password",
        "google",
        "github",
      ]);
      expect(parsed.features.payments).toBe(true);
      expect(parsed.features.locale).toBe("both");
      expect(parsed.features.darkMode).toBe(true);
      expect(parsed.features.email).toBe(true);
      expect(parsed.features.blog).toBe(true);
    });

    it("records disabled features correctly", async () => {
      const config = minimalConfig();
      await generateDocs(config, tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "vibepack.config.json"),
        "utf-8",
      );
      const parsed = JSON.parse(content);

      expect(parsed.projectName).toBe("bare-app");
      expect(parsed.features.auth).toEqual(["email-password"]);
      expect(parsed.features.payments).toBe(false);
      expect(parsed.features.email).toBe(false);
      expect(parsed.features.blog).toBe(false);
      expect(parsed.features.darkMode).toBe(false);
    });

    it("includes generatedAt as valid ISO timestamp", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "vibepack.config.json"),
        "utf-8",
      );
      const parsed = JSON.parse(content);

      const date = new Date(parsed.generatedAt);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  // -----------------------------------------------------------------------
  // .env
  // -----------------------------------------------------------------------
  describe(".env file", () => {
    it("generates .env with core variables always present", async () => {
      await generateDocs(minimalConfig(), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      // Core vars that should always be present
      expect(env).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(env).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      expect(env).toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(env).toContain("DATABASE_URL");
      expect(env).toContain("NEXT_PUBLIC_APP_URL");
      expect(env).toContain("SENTRY_DSN");
      expect(env).toContain("SENTRY_AUTH_TOKEN");
    });

    it("includes Polar env vars when payments enabled", async () => {
      await generateDocs(fullConfig({ payments: true }), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("POLAR_ACCESS_TOKEN");
      expect(env).toContain("POLAR_ORGANIZATION_ID");
      expect(env).toContain("POLAR_WEBHOOK_SECRET");
      expect(env).toContain("NEXT_PUBLIC_POLAR_CHECKOUT_URL");
    });

    it("excludes Polar env vars when payments disabled", async () => {
      await generateDocs(minimalConfig({ payments: false }), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).not.toContain("POLAR_ACCESS_TOKEN");
      expect(env).not.toContain("POLAR_ORGANIZATION_ID");
      expect(env).not.toContain("POLAR_WEBHOOK_SECRET");
      expect(env).not.toContain("NEXT_PUBLIC_POLAR_CHECKOUT_URL");
    });

    it("includes Resend env vars when email enabled", async () => {
      await generateDocs(fullConfig({ email: true }), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("RESEND_API_KEY");
      expect(env).toContain("RESEND_FROM_EMAIL");
    });

    it("excludes Resend env vars when email disabled", async () => {
      await generateDocs(minimalConfig({ email: false }), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).not.toContain("RESEND_API_KEY");
      expect(env).not.toContain("RESEND_FROM_EMAIL");
    });

    it("includes OAuth env vars for selected providers", async () => {
      const config = fullConfig({
        authMethods: ["email-password", "google", "kakao"],
      });
      await generateDocs(config, tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("GOOGLE_CLIENT_ID");
      expect(env).toContain("GOOGLE_CLIENT_SECRET");
      expect(env).toContain("KAKAO_CLIENT_ID");
      expect(env).toContain("KAKAO_CLIENT_SECRET");

      // Should NOT include unselected providers
      expect(env).not.toContain("GITHUB_CLIENT_ID");
      expect(env).not.toContain("NAVER_CLIENT_ID");
      expect(env).not.toContain("APPLE_SERVICE_ID");
    });

    it("includes Apple-specific env vars when apple selected", async () => {
      const config = fullConfig({
        authMethods: ["email-password", "apple"],
      });
      await generateDocs(config, tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("APPLE_SERVICE_ID");
      expect(env).toContain("APPLE_KEY_ID");
      expect(env).toContain("APPLE_TEAM_ID");
      expect(env).toContain("APPLE_PRIVATE_KEY");
    });

    it("excludes OAuth section when no social providers selected", async () => {
      const config = minimalConfig({
        authMethods: ["email-password"],
      });
      await generateDocs(config, tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).not.toContain("OAuth Providers");
      expect(env).not.toContain("GOOGLE_CLIENT_ID");
      expect(env).not.toContain("GITHUB_CLIENT_ID");
    });

    it("does not overwrite existing .env file", async () => {
      const envPath = path.join(tmpDir, ".env");
      await fs.writeFile(envPath, "EXISTING=value\n", "utf-8");

      const consoleSpy = vi.spyOn(console, "log");
      await generateDocs(fullConfig(), tmpDir);

      const env = await fs.readFile(envPath, "utf-8");
      expect(env).toBe("EXISTING=value\n");

      // Should have warned about skipping
      const warningLog = consoleSpy.mock.calls.find((call) =>
        call.some(
          (arg) => typeof arg === "string" && arg.includes("already exists"),
        ),
      );
      expect(warningLog).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("includes project name in app name", async () => {
      await generateDocs(fullConfig({ projectName: "cool-project" }), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain('NEXT_PUBLIC_APP_NAME="cool-project"');
    });

    it("uses section comments to organize env vars", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("# Supabase");
      expect(env).toContain("# Database (Drizzle)");
      expect(env).toContain("# Sentry");
    });
  });

  // -----------------------------------------------------------------------
  // GETTING-STARTED.md
  // -----------------------------------------------------------------------
  describe("GETTING-STARTED.md", () => {
    it("generates a getting-started guide with project name", async () => {
      await generateDocs(fullConfig({ projectName: "my-saas" }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("# my-saas 시작 가이드");
    });

    it("includes feature summary table", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("프로젝트 구성 요약");
      expect(md).toContain("| 인증 |");
      expect(md).toContain("| 결제 |");
      expect(md).toContain("| 다크모드 |");
    });

    it("shows auth methods in Korean labels", async () => {
      const config = fullConfig({
        authMethods: ["email-password", "google", "kakao"],
      });
      await generateDocs(config, tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("이메일/비밀번호");
      expect(md).toContain("Google OAuth");
      expect(md).toContain("카카오 로그인");
    });

    it("includes Supabase setup instructions always", async () => {
      await generateDocs(minimalConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("Supabase");
      expect(md).toContain("supabase.com/dashboard");
    });

    it("includes OAuth provider console links when social auth selected", async () => {
      const config = fullConfig({
        authMethods: ["email-password", "google", "github"],
      });
      await generateDocs(config, tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("console.cloud.google.com");
      expect(md).toContain("github.com/settings/developers");
    });

    it("includes Polar setup when payments enabled", async () => {
      await generateDocs(fullConfig({ payments: true }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("Polar");
      expect(md).toContain("polar.sh");
    });

    it("excludes Polar section when payments disabled", async () => {
      await generateDocs(minimalConfig({ payments: false }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).not.toContain("POLAR_ACCESS_TOKEN");
      expect(md).not.toContain("polar.sh");
    });

    it("includes Resend setup when email enabled", async () => {
      await generateDocs(fullConfig({ email: true }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("Resend");
      expect(md).toContain("resend.com");
    });

    it("excludes Resend section when email disabled", async () => {
      await generateDocs(minimalConfig({ email: false }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).not.toContain("RESEND_API_KEY");
    });

    it("includes Sentry setup instructions always", async () => {
      await generateDocs(minimalConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("Sentry");
      expect(md).toContain("sentry.io");
    });

    it("includes next steps checklist", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("다음 단계 체크리스트");
      expect(md).toContain("환경 변수 값 채우기");
      expect(md).toContain("로고 교체");
      expect(md).toContain("브랜드 컬러 설정");
      expect(md).toContain("랜딩 페이지 커스터마이징");
      expect(md).toContain("Vercel에 배포");
    });

    it("includes conditional checklist items for payments", async () => {
      await generateDocs(fullConfig({ payments: true }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("Polar에서 상품/구독 플랜 생성");
    });

    it("excludes conditional checklist items when features disabled", async () => {
      await generateDocs(
        minimalConfig({ payments: false, email: false, blog: false }),
        tmpDir,
      );

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).not.toContain("Polar에서 상품/구독 플랜 생성");
      expect(md).not.toContain("Resend에서 도메인 인증 완료");
      expect(md).not.toContain("블로그 첫 포스트 작성");
    });

    it("includes blog checklist item when blog enabled", async () => {
      await generateDocs(fullConfig({ blog: true }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("블로그 첫 포스트 작성");
    });

    it("includes email:dev command in useful commands when email enabled", async () => {
      await generateDocs(fullConfig({ email: true }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("pnpm email:dev");
      expect(md).toContain("이메일 템플릿 미리보기");
    });

    it("excludes email:dev command when email disabled", async () => {
      await generateDocs(minimalConfig({ email: false }), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).not.toContain("email:dev");
    });

    it("includes useful commands table", async () => {
      await generateDocs(minimalConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("유용한 명령어");
      expect(md).toContain("pnpm dev");
      expect(md).toContain("pnpm build");
      expect(md).toContain("pnpm test");
    });

    it("content is in Korean", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      // Check for Korean text
      expect(md).toContain("시작 가이드");
      expect(md).toContain("환경 변수 설정");
      expect(md).toContain("시작하기");
      expect(md).toContain("의존성 설치");
    });
  });

  // -----------------------------------------------------------------------
  // dryRun mode
  // -----------------------------------------------------------------------
  describe("dryRun mode", () => {
    it("does not create any files when dryRun is true", async () => {
      await generateDocs(fullConfig(), tmpDir, { dryRun: true });

      const files = await fs.readdir(tmpDir);
      expect(files).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // All three files created together
  // -----------------------------------------------------------------------
  describe("file creation", () => {
    it("creates all three output files", async () => {
      await generateDocs(fullConfig(), tmpDir);

      const files = await fs.readdir(tmpDir);
      expect(files).toContain("vibepack.config.json");
      expect(files).toContain(".env");
      expect(files).toContain("GETTING-STARTED.md");
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases: all OAuth providers
  // -----------------------------------------------------------------------
  describe("all OAuth providers", () => {
    it("generates env vars for all five OAuth providers", async () => {
      const config = fullConfig({
        authMethods: [
          "email-password",
          "google",
          "github",
          "kakao",
          "naver",
          "apple",
        ],
      });
      await generateDocs(config, tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      expect(env).toContain("GOOGLE_CLIENT_ID");
      expect(env).toContain("GITHUB_CLIENT_ID");
      expect(env).toContain("KAKAO_CLIENT_ID");
      expect(env).toContain("NAVER_CLIENT_ID");
      expect(env).toContain("APPLE_SERVICE_ID");
    });

    it("generates console links for all providers in getting started", async () => {
      const config = fullConfig({
        authMethods: [
          "email-password",
          "google",
          "github",
          "kakao",
          "naver",
          "apple",
        ],
      });
      await generateDocs(config, tmpDir);

      const md = await fs.readFile(
        path.join(tmpDir, "GETTING-STARTED.md"),
        "utf-8",
      );

      expect(md).toContain("console.cloud.google.com");
      expect(md).toContain("github.com/settings/developers");
      expect(md).toContain("developers.kakao.com");
      expect(md).toContain("developers.naver.com");
      expect(md).toContain("developer.apple.com");
    });
  });

  // -----------------------------------------------------------------------
  // Non-social auth methods (magic-link, otp) don't add OAuth env vars
  // -----------------------------------------------------------------------
  describe("non-social auth methods", () => {
    it("does not include OAuth env vars for magic-link and otp", async () => {
      const config = fullConfig({
        authMethods: ["email-password", "magic-link", "otp"],
        email: true,
      });
      await generateDocs(config, tmpDir);

      const env = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");

      // Should NOT have OAuth provider section
      expect(env).not.toContain("GOOGLE_CLIENT_ID");
      expect(env).not.toContain("GITHUB_CLIENT_ID");
      expect(env).not.toContain("OAuth Providers");

      // Should still have email env vars
      expect(env).toContain("RESEND_API_KEY");
    });
  });
});
