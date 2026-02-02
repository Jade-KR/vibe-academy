import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock all dependencies used by the form components
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    if (params?.provider) return `Continue with ${params.provider}`;
    return key;
  },
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("Auth Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    delete (window as any).location;
    (window as any).location = { ...window.location, href: "" };
  });

  it("login page renders LoginForm", async () => {
    const LoginPage = (await import("@/app/[locale]/(auth)/login/page")).default;
    render(<LoginPage />);
    // LoginForm renders a card with login title
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("password")).toBeInTheDocument();
  });

  it("register page renders RegisterForm", async () => {
    const RegisterPage = (await import("@/app/[locale]/(auth)/register/page")).default;
    render(<RegisterPage />);
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("confirmPassword")).toBeInTheDocument();
  });

  it("forgot-password page renders ForgotPasswordForm", async () => {
    const ForgotPasswordPage = (await import("@/app/[locale]/(auth)/forgot-password/page")).default;
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("reset-password page renders ResetPasswordForm", async () => {
    const ResetPasswordPage = (await import("@/app/[locale]/(auth)/reset-password/page")).default;
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText("password")).toBeInTheDocument();
  });

  it("magic-link page renders MagicLinkForm", async () => {
    const MagicLinkPage = (await import("@/app/[locale]/(auth)/magic-link/page")).default;
    render(<MagicLinkPage />);
    expect(screen.getByLabelText("email")).toBeInTheDocument();
  });

  it("otp page renders OTPForm", async () => {
    const OtpPage = (await import("@/app/[locale]/(auth)/otp/page")).default;
    render(<OtpPage />);
    expect(screen.getByLabelText("email")).toBeInTheDocument();
  });
});
