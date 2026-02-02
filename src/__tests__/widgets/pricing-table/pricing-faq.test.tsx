import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PricingFaq", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders FAQ section heading", async () => {
    const { PricingFaq } = await import("@/widgets/pricing-table/ui/pricing-faq");
    render(<PricingFaq />);
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
  });

  it("renders all 4 FAQ questions", async () => {
    const { PricingFaq } = await import("@/widgets/pricing-table/ui/pricing-faq");
    render(<PricingFaq />);
    expect(screen.getByText("q1")).toBeInTheDocument();
    expect(screen.getByText("q2")).toBeInTheDocument();
    expect(screen.getByText("q3")).toBeInTheDocument();
    expect(screen.getByText("q4")).toBeInTheDocument();
  });

  it("expands an answer when question is clicked", async () => {
    const user = userEvent.setup();
    const { PricingFaq } = await import("@/widgets/pricing-table/ui/pricing-faq");
    render(<PricingFaq />);

    // Click the first question trigger
    const trigger = screen.getByText("q1");
    await user.click(trigger);

    // Answer should now be visible
    expect(screen.getByText("a1")).toBeInTheDocument();
  });
});
