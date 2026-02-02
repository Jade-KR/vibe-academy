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
vi.mock("@/widgets/pricing-table", () => ({
  PricingTable: () => <div data-testid="pricing-table" />,
}));
vi.mock("../../../widgets/landing/ui/hero-section", () => ({
  HeroSection: () => <div data-testid="hero-section" />,
}));
vi.mock("../../../widgets/landing/ui/features-section", () => ({
  FeaturesSection: () => <div data-testid="features-section" />,
}));
vi.mock("../../../widgets/landing/ui/how-it-works-section", () => ({
  HowItWorksSection: () => <div data-testid="how-it-works-section" />,
}));
vi.mock("../../../widgets/landing/ui/testimonials-section", () => ({
  TestimonialsSection: () => <div data-testid="testimonials-section" />,
}));
vi.mock("../../../widgets/landing/ui/cta-section", () => ({
  CtaSection: () => <div data-testid="cta-section" />,
}));

describe("LandingContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders HeroSection", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("renders FeaturesSection", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("features-section")).toBeInTheDocument();
  });

  it("renders HowItWorksSection", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("how-it-works-section")).toBeInTheDocument();
  });

  it("renders a pricing section with PricingTable", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("pricing-table")).toBeInTheDocument();
  });

  it("renders TestimonialsSection", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("testimonials-section")).toBeInTheDocument();
  });

  it("renders CtaSection", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    render(<LandingContent />);
    expect(screen.getByTestId("cta-section")).toBeInTheDocument();
  });

  it("all sections appear in correct order", async () => {
    const { LandingContent } = await import("@/widgets/landing/ui/landing-content");
    const { container } = render(<LandingContent />);

    const sections = container.querySelectorAll("[data-testid]");
    const order = Array.from(sections).map((el) => el.getAttribute("data-testid"));

    expect(order).toEqual([
      "hero-section",
      "features-section",
      "how-it-works-section",
      "pricing-table",
      "testimonials-section",
      "cta-section",
    ]);
  });
});
