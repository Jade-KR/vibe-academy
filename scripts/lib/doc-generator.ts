import path from "node:path";

import {
  fileExists,
  writeFileContent,
  type FileOperationOptions,
} from "./file-operations";
import type { SetupConfig, AuthMethod } from "./types";
import { OAUTH_PROVIDERS } from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate personalized documentation files based on the user's setup choices.
 *
 * Creates three files at projectRoot:
 * 1. `vibepack.config.json` — Record of chosen configuration
 * 2. `.env` — Environment variables with empty values and comments
 * 3. `GETTING-STARTED.md` — Personalized quickstart guide (Korean)
 *
 * If `.env` already exists it is skipped with a warning.
 */
export async function generateDocs(
  config: SetupConfig,
  projectRoot: string,
  options?: { dryRun?: boolean },
): Promise<void> {
  const opts: FileOperationOptions = { dryRun: options?.dryRun ?? false };

  console.log("\n--- Generating Documentation ---\n");

  // 1. vibepack.config.json
  console.log("[1/3] Generating vibepack.config.json...");
  await writeFileContent(
    path.join(projectRoot, "vibepack.config.json"),
    generateConfigJson(config),
    opts,
  );

  // 2. .env (skip if already exists)
  console.log("\n[2/3] Generating .env...");
  const envPath = path.join(projectRoot, ".env");
  if (await fileExists(envPath)) {
    console.log("  \u26A0 .env already exists — skipping (will not overwrite)");
  } else {
    await writeFileContent(envPath, generateEnvFile(config), opts);
  }

  // 3. GETTING-STARTED.md
  console.log("\n[3/3] Generating GETTING-STARTED.md...");
  await writeFileContent(
    path.join(projectRoot, "GETTING-STARTED.md"),
    generateGettingStarted(config),
    opts,
  );

  console.log("\n--- Documentation Generation Complete ---\n");
}

// ---------------------------------------------------------------------------
// 1. vibepack.config.json
// ---------------------------------------------------------------------------

function generateConfigJson(config: SetupConfig): string {
  const output = {
    generatedAt: new Date().toISOString(),
    projectName: config.projectName,
    features: {
      auth: config.authMethods,
      payments: config.payments,
      locale: config.locale,
      darkMode: config.darkMode,
      email: config.email,
      blog: config.blog,
    },
  };

  return JSON.stringify(output, null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// 2. .env
// ---------------------------------------------------------------------------

/** OAuth provider env var mapping */
const OAUTH_ENV_MAP: Record<string, { vars: string[]; label: string }> = {
  google: {
    vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    label: "Google OAuth",
  },
  github: {
    vars: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    label: "GitHub OAuth",
  },
  kakao: {
    vars: ["KAKAO_CLIENT_ID", "KAKAO_CLIENT_SECRET"],
    label: "Kakao OAuth",
  },
  naver: {
    vars: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    label: "Naver OAuth",
  },
  apple: {
    vars: [
      "APPLE_SERVICE_ID",
      "APPLE_KEY_ID",
      "APPLE_TEAM_ID",
      "APPLE_PRIVATE_KEY",
    ],
    label: "Apple OAuth",
  },
};

function generateEnvFile(config: SetupConfig): string {
  const sections: string[] = [];

  // Header
  sections.push(
    "# ===========================================",
    `# ${config.projectName} Environment Variables`,
    "# ===========================================",
    "# Setup CLI에 의해 자동 생성됨",
    "# 아래 값을 실제 값으로 채워주세요",
    "",
  );

  // App Configuration
  sections.push(
    "# -------------------------------------------",
    "# App Configuration",
    "# -------------------------------------------",
    `NEXT_PUBLIC_APP_NAME="${config.projectName}"`,
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
    "",
  );

  // Supabase (always required)
  sections.push(
    "# -------------------------------------------",
    "# Supabase",
    "# -------------------------------------------",
    "# Supabase Dashboard > Settings > API 에서 확인",
    'NEXT_PUBLIC_SUPABASE_URL=""',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=""',
    'SUPABASE_SERVICE_ROLE_KEY=""',
    "",
  );

  // Database (always required)
  sections.push(
    "# -------------------------------------------",
    "# Database (Drizzle)",
    "# -------------------------------------------",
    "# Supabase Dashboard > Settings > Database 에서 확인",
    'DATABASE_URL=""',
    "",
  );

  // OAuth Providers — only for selected social auth methods
  const selectedOAuth = config.authMethods.filter((m) =>
    OAUTH_PROVIDERS.includes(m),
  );

  if (selectedOAuth.length > 0) {
    sections.push(
      "# -------------------------------------------",
      "# OAuth Providers",
      "# -------------------------------------------",
    );

    for (const provider of selectedOAuth) {
      const mapping = OAUTH_ENV_MAP[provider];
      if (mapping) {
        sections.push(`# ${mapping.label}`);
        for (const envVar of mapping.vars) {
          sections.push(`${envVar}=""`);
        }
        sections.push("");
      }
    }
  }

  // Payments (Polar) — only if enabled
  if (config.payments) {
    sections.push(
      "# -------------------------------------------",
      "# Polar (Payments)",
      "# -------------------------------------------",
      "# Polar Dashboard > Settings 에서 확인",
      'POLAR_ACCESS_TOKEN=""',
      'POLAR_ORGANIZATION_ID=""',
      'POLAR_WEBHOOK_SECRET=""',
      'NEXT_PUBLIC_POLAR_CHECKOUT_URL=""',
      "",
    );
  }

  // Email (Resend) — only if enabled
  if (config.email) {
    sections.push(
      "# -------------------------------------------",
      "# Resend (Email)",
      "# -------------------------------------------",
      "# Resend Dashboard > API Keys 에서 확인",
      'RESEND_API_KEY=""',
      'RESEND_FROM_EMAIL="noreply@yourdomain.com"',
      "",
    );
  }

  // Sentry (always required)
  sections.push(
    "# -------------------------------------------",
    "# Sentry",
    "# -------------------------------------------",
    "# Sentry Dashboard > Settings > Client Keys 에서 확인",
    'SENTRY_DSN=""',
    'SENTRY_AUTH_TOKEN=""',
    "",
  );

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// 3. GETTING-STARTED.md (Korean)
// ---------------------------------------------------------------------------

/** Human-readable labels for auth methods (Korean) */
const AUTH_LABELS: Record<AuthMethod, string> = {
  "email-password": "이메일/비밀번호",
  google: "Google OAuth",
  github: "GitHub OAuth",
  kakao: "카카오 로그인",
  naver: "네이버 로그인",
  apple: "Apple 로그인",
  "magic-link": "매직링크",
  otp: "OTP 인증",
};

/** Locale labels */
const LOCALE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "영어",
  both: "한국어 + 영어",
};

function generateGettingStarted(config: SetupConfig): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${config.projectName} 시작 가이드`);
  lines.push("");
  lines.push(
    "> 이 문서는 Setup CLI에 의해 자동 생성되었습니다.",
  );
  lines.push("");

  // ── Feature Summary ──
  lines.push("## 프로젝트 구성 요약");
  lines.push("");
  lines.push("| 기능 | 상태 |");
  lines.push("| --- | --- |");
  lines.push(
    `| 인증 | ${config.authMethods.map((m) => AUTH_LABELS[m]).join(", ")} |`,
  );
  lines.push(`| 결제 | ${config.payments ? "Polar" : "미포함"} |`);
  lines.push(`| 언어 | ${LOCALE_LABELS[config.locale]} |`);
  lines.push(`| 다크모드 | ${config.darkMode ? "지원" : "미포함"} |`);
  lines.push(`| 이메일 | ${config.email ? "Resend" : "미포함"} |`);
  lines.push(`| 블로그 | ${config.blog ? "MDX" : "미포함"} |`);
  lines.push("");

  // ── Environment Variable Setup ──
  lines.push("## 환경 변수 설정");
  lines.push("");
  lines.push(
    "프로젝트 루트의 `.env` 파일을 열어 아래 값들을 채워주세요.",
  );
  lines.push("");

  // Supabase (always)
  lines.push("### 1. Supabase");
  lines.push("");
  lines.push(
    "Supabase 프로젝트를 생성하고 다음 값을 설정하세요:",
  );
  lines.push("");
  lines.push("- `NEXT_PUBLIC_SUPABASE_URL` - 프로젝트 URL");
  lines.push("- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon 퍼블릭 키");
  lines.push("- `SUPABASE_SERVICE_ROLE_KEY` - service role 키 (서버 전용)");
  lines.push("- `DATABASE_URL` - PostgreSQL 연결 문자열");
  lines.push("");
  lines.push(
    "> 콘솔: [https://supabase.com/dashboard](https://supabase.com/dashboard)",
  );
  lines.push("");

  // OAuth providers
  const selectedOAuth = config.authMethods.filter((m) =>
    OAUTH_PROVIDERS.includes(m),
  );

  if (selectedOAuth.length > 0) {
    lines.push("### 2. OAuth 프로바이더");
    lines.push("");
    lines.push(
      "Supabase Dashboard > Authentication > Providers 에서 각 프로바이더를 활성화하세요.",
    );
    lines.push("");

    for (const provider of selectedOAuth) {
      const mapping = OAUTH_ENV_MAP[provider];
      if (mapping) {
        lines.push(`**${mapping.label}**`);
        lines.push("");
        for (const envVar of mapping.vars) {
          lines.push(`- \`${envVar}\``);
        }
        lines.push("");
        lines.push(`> 콘솔: ${getProviderConsoleUrl(provider)}`);
        lines.push("");
      }
    }
  }

  // Payments
  let sectionNumber = selectedOAuth.length > 0 ? 3 : 2;

  if (config.payments) {
    lines.push(`### ${sectionNumber}. Polar (결제)`);
    lines.push("");
    lines.push(
      "Polar 계정을 생성하고 organization을 설정하세요:",
    );
    lines.push("");
    lines.push("- `POLAR_ACCESS_TOKEN` - API 액세스 토큰");
    lines.push("- `POLAR_ORGANIZATION_ID` - 조직 ID");
    lines.push("- `POLAR_WEBHOOK_SECRET` - 웹훅 시크릿");
    lines.push("- `NEXT_PUBLIC_POLAR_CHECKOUT_URL` - 결제 페이지 URL");
    lines.push("");
    lines.push(
      "> 콘솔: [https://polar.sh/dashboard](https://polar.sh/dashboard)",
    );
    lines.push("");
    sectionNumber++;
  }

  // Email
  if (config.email) {
    lines.push(`### ${sectionNumber}. Resend (이메일)`);
    lines.push("");
    lines.push("Resend에서 API 키를 발급받고 도메인을 인증하세요:");
    lines.push("");
    lines.push("- `RESEND_API_KEY` - API 키");
    lines.push(
      '- `RESEND_FROM_EMAIL` - 발신 이메일 (예: noreply@yourdomain.com)',
    );
    lines.push("");
    lines.push(
      "> 콘솔: [https://resend.com/api-keys](https://resend.com/api-keys)",
    );
    lines.push("");
    sectionNumber++;
  }

  // Sentry (always)
  lines.push(`### ${sectionNumber}. Sentry (모니터링)`);
  lines.push("");
  lines.push(
    "Sentry 프로젝트를 생성하고 DSN을 설정하세요:",
  );
  lines.push("");
  lines.push("- `SENTRY_DSN` - 클라이언트 DSN");
  lines.push("- `SENTRY_AUTH_TOKEN` - 인증 토큰 (소스맵 업로드용)");
  lines.push("");
  lines.push(
    "> 콘솔: [https://sentry.io](https://sentry.io)",
  );
  lines.push("");

  // ── Getting Started Steps ──
  lines.push("## 시작하기");
  lines.push("");
  lines.push("```bash");
  lines.push("# 1. 의존성 설치");
  lines.push("pnpm install");
  lines.push("");
  lines.push("# 2. 환경 변수 설정");
  lines.push("# .env 파일의 빈 값들을 채워주세요");
  lines.push("");
  lines.push("# 3. 데이터베이스 마이그레이션");
  lines.push("pnpm db:push");
  lines.push("");
  lines.push("# 4. 개발 서버 시작");
  lines.push("pnpm dev");
  lines.push("```");
  lines.push("");

  // ── Next Steps Checklist ──
  lines.push("## 다음 단계 체크리스트");
  lines.push("");
  lines.push("- [ ] `.env` 파일의 환경 변수 값 채우기");
  lines.push(
    "- [ ] `src/shared/config/site.ts`에서 사이트 이름, 설명, URL 수정",
  );
  lines.push("- [ ] 로고 교체 (`public/` 디렉토리)");
  lines.push("- [ ] 브랜드 컬러 설정 (`tailwind.config.ts`)");
  lines.push("- [ ] 랜딩 페이지 커스터마이징");

  if (config.payments) {
    lines.push("- [ ] Polar에서 상품/구독 플랜 생성");
  }

  if (config.email) {
    lines.push("- [ ] Resend에서 도메인 인증 완료");
    lines.push("- [ ] 이메일 템플릿 커스터마이징");
  }

  if (config.blog) {
    lines.push("- [ ] 블로그 첫 포스트 작성 (`src/content/blog/`)");
  }

  lines.push("- [ ] Sentry 프로젝트 설정");
  lines.push("- [ ] Vercel에 배포");
  lines.push("");

  // ── Useful Commands ──
  lines.push("## 유용한 명령어");
  lines.push("");
  lines.push("| 명령어 | 설명 |");
  lines.push("| --- | --- |");
  lines.push("| `pnpm dev` | 개발 서버 시작 |");
  lines.push("| `pnpm build` | 프로덕션 빌드 |");
  lines.push("| `pnpm lint` | ESLint 실행 |");
  lines.push("| `pnpm typecheck` | TypeScript 타입 체크 |");
  lines.push("| `pnpm test` | Vitest 단위 테스트 |");
  lines.push("| `pnpm test:e2e` | Playwright E2E 테스트 |");
  lines.push("| `pnpm db:push` | DB 스키마 적용 |");
  lines.push("| `pnpm db:generate` | DB 마이그레이션 생성 |");

  if (config.email) {
    lines.push("| `pnpm email:dev` | 이메일 템플릿 미리보기 |");
  }

  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProviderConsoleUrl(provider: AuthMethod): string {
  const urls: Partial<Record<AuthMethod, string>> = {
    google:
      "[https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)",
    github:
      "[https://github.com/settings/developers](https://github.com/settings/developers)",
    kakao:
      "[https://developers.kakao.com/console](https://developers.kakao.com/console)",
    naver:
      "[https://developers.naver.com/apps](https://developers.naver.com/apps)",
    apple:
      "[https://developer.apple.com/account/resources](https://developer.apple.com/account/resources)",
  };

  return urls[provider] ?? "";
}
