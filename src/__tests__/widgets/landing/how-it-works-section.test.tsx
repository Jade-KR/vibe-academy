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

describe("HowItWorksSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section heading with howItWorks title key", async () => {
    const { HowItWorksSection } = await import("@/widgets/landing/ui/how-it-works-section");
    render(<HowItWorksSection />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("howItWorks.title");
  });

  it("renders subtitle", async () => {
    const { HowItWorksSection } = await import("@/widgets/landing/ui/how-it-works-section");
    render(<HowItWorksSection />);
    expect(screen.getByText("howItWorks.subtitle")).toBeInTheDocument();
  });

  it("renders 3 step cards with step numbers 1, 2, 3 visible", async () => {
    const { HowItWorksSection } = await import("@/widgets/landing/ui/how-it-works-section");
    render(<HowItWorksSection />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("each step has title and description keys", async () => {
    const { HowItWorksSection } = await import("@/widgets/landing/ui/how-it-works-section");
    render(<HowItWorksSection />);

    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`howItWorks.steps.${i}.title`)).toBeInTheDocument();
      expect(screen.getByText(`howItWorks.steps.${i}.description`)).toBeInTheDocument();
    }
  });
});
