import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Apply mocks before imports
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    if (params?.provider) return `Continue with ${params.provider}`;
    return key;
  },
  useLocale: () => "en",
}));

describe("SocialLoginButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location mock
    delete (window as any).location;
    (window as any).location = { ...window.location, href: "" };
  });

  it("renders all 5 provider buttons", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kakao/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /naver/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });

  it("renders a divider with 'or' text", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons />);

    expect(screen.getByText("dividerText")).toBeInTheDocument();
  });

  it("redirects to correct OAuth URL when a provider button is clicked", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    expect(window.location.href).toBe("/api/auth/social/google");
  });

  it("shows only specified providers when `providers` prop is given", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons providers={["google", "github"]} />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kakao/i })).not.toBeInTheDocument();
  });

  it("hides divider when showDivider is false", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons showDivider={false} />);

    expect(screen.queryByText("dividerText")).not.toBeInTheDocument();
  });

  it("disables all buttons when disabled prop is true", async () => {
    const { SocialLoginButtons } = await import("@/features/auth/social-login");
    render(<SocialLoginButtons disabled />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
