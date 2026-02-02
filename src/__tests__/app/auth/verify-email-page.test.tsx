import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("VerifyEmailPage", () => {
  it("renders VerifyEmailCard", async () => {
    const VerifyEmailPage = (await import("@/app/[locale]/(auth)/verify-email/page")).default;
    render(<VerifyEmailPage />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });
});
