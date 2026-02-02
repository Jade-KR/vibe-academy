import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CtaSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading with CTA title key", async () => {
    const { CtaSection } = await import("@/widgets/landing/ui/cta-section");
    render(<CtaSection />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("cta.title");
  });

  it("renders subtitle", async () => {
    const { CtaSection } = await import("@/widgets/landing/ui/cta-section");
    render(<CtaSection />);
    expect(screen.getByText("cta.subtitle")).toBeInTheDocument();
  });

  it("renders CTA button as link to /register", async () => {
    const { CtaSection } = await import("@/widgets/landing/ui/cta-section");
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: "cta.button" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("button has lg size variant", async () => {
    const { CtaSection } = await import("@/widgets/landing/ui/cta-section");
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: "cta.button" });
    expect(link.className).toMatch(/px-8/);
  });
});
