import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("VerifyEmailCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders check-your-email message", async () => {
    const { VerifyEmailCard } = await import("@/features/auth/verify-email");
    render(<VerifyEmailCard />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders link back to login", async () => {
    const { VerifyEmailCard } = await import("@/features/auth/verify-email");
    render(<VerifyEmailCard />);

    expect(screen.getByText("backToLogin")).toBeInTheDocument();
  });
});
