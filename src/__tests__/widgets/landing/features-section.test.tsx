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

describe("FeaturesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section heading with features title key", async () => {
    const { FeaturesSection } = await import("@/widgets/landing/ui/features-section");
    render(<FeaturesSection />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("features.title");
  });

  it("renders subtitle", async () => {
    const { FeaturesSection } = await import("@/widgets/landing/ui/features-section");
    render(<FeaturesSection />);
    expect(screen.getByText("features.subtitle")).toBeInTheDocument();
  });

  it("renders 6 feature cards with all title keys", async () => {
    const { FeaturesSection } = await import("@/widgets/landing/ui/features-section");
    render(<FeaturesSection />);

    for (let i = 0; i < 6; i++) {
      expect(screen.getByText(`features.items.${i}.title`)).toBeInTheDocument();
    }
  });

  it("each card has a title and description", async () => {
    const { FeaturesSection } = await import("@/widgets/landing/ui/features-section");
    render(<FeaturesSection />);

    for (let i = 0; i < 6; i++) {
      expect(screen.getByText(`features.items.${i}.title`)).toBeInTheDocument();
      expect(screen.getByText(`features.items.${i}.description`)).toBeInTheDocument();
    }
  });

  it("all 6 lucide icons are rendered", async () => {
    const { FeaturesSection } = await import("@/widgets/landing/ui/features-section");
    render(<FeaturesSection />);

    const expectedIcons = [
      "icon-shield",
      "icon-credit-card",
      "icon-mail",
      "icon-globe",
      "icon-database",
      "icon-activity",
    ];

    for (const testId of expectedIcons) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
  });
});
