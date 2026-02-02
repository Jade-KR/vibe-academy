import path from "node:path";

import * as p from "@clack/prompts";

import { runPrompts } from "./lib/prompts";
import { updateProject } from "./lib/config-updater";
import { generateDocs } from "./lib/doc-generator";
import type { SetupConfig } from "./lib/types";

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const projectRoot = path.resolve(__dirname, "..");

  // 1. Welcome banner
  p.intro("vibePack Setup");

  // 2. Collect user preferences
  const config = await runPrompts();

  // 3. Display summary and confirm
  displaySummary(config);

  const confirmed = await p.confirm({
    message: "위 설정으로 프로젝트를 구성하시겠습니까?",
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("설정이 취소되었습니다.");
    process.exit(0);
  }

  // 4. Apply configuration (remove unused modules, configure kept modules)
  const spinner = p.spinner();
  spinner.start("프로젝트 구성 중...");

  try {
    await updateProject(config, projectRoot);
    spinner.stop("프로젝트 구성 완료");
  } catch (error) {
    spinner.stop("프로젝트 구성 중 오류 발생");
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`구성 오류: ${message}`);
    process.exit(1);
  }

  // 5. Generate documentation (.env, GETTING-STARTED.md, vibepack.config.json)
  spinner.start("문서 생성 중...");

  try {
    await generateDocs(config, projectRoot);
    spinner.stop("문서 생성 완료");
  } catch (error) {
    spinner.stop("문서 생성 중 오류 발생");
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`문서 생성 오류: ${message}`);
    // Non-fatal: continue even if doc generation fails
  }

  // 6. Completion
  p.note(
    [
      "1. .env 파일의 환경 변수를 채워주세요",
      "2. pnpm db:push 로 데이터베이스를 설정하세요",
      "3. pnpm dev 로 개발 서버를 시작하세요",
      "",
      "자세한 내용은 GETTING-STARTED.md를 참조하세요.",
    ].join("\n"),
    "다음 단계",
  );

  p.outro("설정이 완료되었습니다! 🎉");
}

// ---------------------------------------------------------------------------
// Summary Display
// ---------------------------------------------------------------------------

function displaySummary(config: SetupConfig) {
  const authLabels: Record<string, string> = {
    "email-password": "이메일/비밀번호",
    google: "Google",
    github: "GitHub",
    kakao: "카카오",
    naver: "네이버",
    apple: "Apple",
    "magic-link": "매직링크",
    otp: "OTP",
  };

  const authLabel = config.authMethods.map((m) => authLabels[m] || m).join(", ");

  const localeLabels: Record<string, string> = {
    ko: "한국어만",
    en: "영어만",
    both: "한국어 + 영어",
  };

  const lines = [
    `프로젝트: ${config.projectName}`,
    `인증: ${authLabel}`,
    `결제: ${config.payments ? "Polar" : "없음"}`,
    `언어: ${localeLabels[config.locale]}`,
    `다크모드: ${config.darkMode ? "지원" : "미지원"}`,
    `이메일: ${config.email ? "Resend" : "없음"}`,
    `블로그: ${config.blog ? "MDX" : "없음"}`,
  ];

  p.note(lines.join("\n"), "선택한 설정");
}

main().catch(console.error);
