import * as p from "@clack/prompts";
import type { SetupConfig, AuthMethod, Locale } from "./types";
import { EMAIL_DEPENDENT_AUTH } from "./types";

/**
 * Check if user cancelled the prompt and exit gracefully.
 */
function handleCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("설정이 취소되었습니다.");
    process.exit(0);
  }
  return value as T;
}

/**
 * Run all 7 interactive prompts and return a complete SetupConfig.
 */
export async function runPrompts(): Promise<SetupConfig> {
  // 1. Project Name
  const projectName = handleCancel(
    await p.text({
      message: "프로젝트 이름을 입력하세요",
      placeholder: "my-saas",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "프로젝트 이름은 필수입니다";
        }
        if (!/^[a-z0-9][a-z0-9-]*$/.test(value.trim())) {
          return "소문자, 숫자, 하이픈만 사용 가능합니다 (예: my-saas)";
        }
      },
    })
  );

  // 2. Auth Methods (email-password is always included, not listed as option)
  const selectedAuth = handleCancel(
    await p.multiselect<AuthMethod>({
      message: "인증 방식을 선택하세요 (이메일/비밀번호는 기본 포함)",
      options: [
        { value: "google", label: "Google OAuth" },
        { value: "github", label: "GitHub OAuth" },
        { value: "kakao", label: "카카오 로그인" },
        { value: "naver", label: "네이버 로그인" },
        { value: "apple", label: "Apple 로그인" },
        { value: "magic-link", label: "매직링크", hint: "이메일 필요" },
        { value: "otp", label: "OTP 인증", hint: "이메일 필요" },
      ],
      required: false,
    })
  );

  let authMethods: AuthMethod[] = [...selectedAuth];

  // 3. Payments
  const payments = handleCancel(
    await p.confirm({
      message: "결제 시스템을 포함하시겠습니까? (Polar)",
      initialValue: true,
    })
  );

  // 4. Locale
  const locale = handleCancel(
    await p.select<Locale>({
      message: "지원 언어를 선택하세요",
      options: [
        { value: "both", label: "한국어 + 영어", hint: "권장" },
        { value: "ko", label: "한국어만" },
        { value: "en", label: "영어만" },
      ],
      initialValue: "both",
    })
  );

  // 5. Dark Mode
  const darkMode = handleCancel(
    await p.confirm({
      message: "다크모드를 지원하시겠습니까?",
      initialValue: true,
    })
  );

  // 6. Email
  const email = handleCancel(
    await p.confirm({
      message: "이메일 시스템을 포함하시겠습니까? (Resend)",
      initialValue: true,
    })
  );

  // Dependency validation: email=false forces magic-link and otp off
  if (!email) {
    const emailDependentSelected = authMethods.filter((m) =>
      EMAIL_DEPENDENT_AUTH.includes(m)
    );

    if (emailDependentSelected.length > 0) {
      p.note(
        `이메일 비활성화로 인해 다음 인증 방식이 제거됩니다:\n${emailDependentSelected.map((m) => `  - ${m}`).join("\n")}`,
        "의존성 조정"
      );
      authMethods = authMethods.filter(
        (m) => !EMAIL_DEPENDENT_AUTH.includes(m)
      );
    }
  }

  // 7. Blog
  const blog = handleCancel(
    await p.confirm({
      message: "블로그 시스템을 포함하시겠습니까? (MDX)",
      initialValue: false,
    })
  );

  return {
    projectName: projectName.trim(),
    authMethods: ["email-password", ...authMethods],
    payments,
    locale,
    darkMode,
    email,
    blog,
  };
}
