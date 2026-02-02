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

describe("PricingContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", async () => {
    const { PricingContent } = await import("@/widgets/pricing-table/ui/pricing-content");
    render(<PricingContent />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("title");
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders PricingTable section", async () => {
    const { PricingContent } = await import("@/widgets/pricing-table/ui/pricing-content");
    render(<PricingContent />);
    // PricingTable renders plan names
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("renders PricingFaq section", async () => {
    const { PricingContent } = await import("@/widgets/pricing-table/ui/pricing-content");
    render(<PricingContent />);
    // FAQ renders question keys
    expect(screen.getByText("q1")).toBeInTheDocument();
    expect(screen.getByText("q2")).toBeInTheDocument();
  });
});
