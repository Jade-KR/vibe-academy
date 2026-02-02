import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("renders legal links for terms and privacy", async () => {
    const { Footer } = await import("@/widgets/footer/ui/footer");
    const result = await Footer();
    const { container } = render(result);

    const termsLink = screen.getByText("terms");
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest("a")).toHaveAttribute("href", "/legal/terms");

    const privacyLink = screen.getByText("privacy");
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest("a")).toHaveAttribute("href", "/legal/privacy");
  });

  it("renders copyright text", async () => {
    const { Footer } = await import("@/widgets/footer/ui/footer");
    const result = await Footer();
    render(result);

    expect(screen.getByText(/copyright/)).toBeInTheDocument();
  });
});
