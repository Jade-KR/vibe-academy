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

describe("HeroSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading with hero title translation key", async () => {
    const { HeroSection } = await import("@/widgets/landing/ui/hero-section");
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("hero.title");
  });

  it("renders subtitle paragraph", async () => {
    const { HeroSection } = await import("@/widgets/landing/ui/hero-section");
    render(<HeroSection />);
    expect(screen.getByText("hero.subtitle")).toBeInTheDocument();
  });

  it("renders primary CTA link pointing to /register", async () => {
    const { HeroSection } = await import("@/widgets/landing/ui/hero-section");
    render(<HeroSection />);
    const primaryLink = screen.getByRole("link", { name: "hero.cta" });
    expect(primaryLink).toHaveAttribute("href", "/register");
  });

  it("renders secondary CTA link pointing to /pricing", async () => {
    const { HeroSection } = await import("@/widgets/landing/ui/hero-section");
    render(<HeroSection />);
    const secondaryLink = screen.getByRole("link", { name: "hero.secondaryCta" });
    expect(secondaryLink).toHaveAttribute("href", "/pricing");
  });

  it("both CTA buttons are rendered as links", async () => {
    const { HeroSection } = await import("@/widgets/landing/ui/hero-section");
    render(<HeroSection />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });
});
