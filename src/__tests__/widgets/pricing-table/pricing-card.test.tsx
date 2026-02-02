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

describe("PricingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const freePlan = {
    id: "free" as const,
    name: "Free",
    description: "Free plan description",
    price: { monthly: 0, yearly: 0 },
    features: ["Feature A", "Feature B"],
    limits: { apiCalls: 100, storage: 100 },
  };

  const proPlan = {
    id: "pro" as const,
    name: "Pro",
    description: "Pro plan description",
    polarProductId: "prod_123",
    price: { monthly: 19_000, yearly: 190_000 },
    features: ["Feature A", "Feature B", "Feature C"],
    limits: { apiCalls: 10_000, storage: 10_240 },
  };

  const enterprisePlan = {
    id: "enterprise" as const,
    name: "Enterprise",
    description: "Enterprise plan description",
    polarProductId: "prod_456",
    price: { monthly: 99_000, yearly: 990_000 },
    features: ["Feature A", "Feature B", "Feature C", "Feature D"],
    limits: { apiCalls: -1, storage: -1 },
  };

  it("renders plan name and description", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="monthly" />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Pro plan description")).toBeInTheDocument();
  });

  it("renders monthly price formatted as KRW when interval is monthly", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="monthly" />);
    // 19,000 formatted in ko-KR
    expect(screen.getByText(/19,000/)).toBeInTheDocument();
    expect(screen.getByText(/perMonth/)).toBeInTheDocument();
  });

  it("renders yearly price formatted as KRW when interval is yearly", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="yearly" />);
    expect(screen.getByText(/190,000/)).toBeInTheDocument();
    expect(screen.getByText(/perYear/)).toBeInTheDocument();
  });

  it("renders all plan features as list items", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="monthly" />);
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  it("renders 'getStarted' CTA linking to /register for free plan", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={freePlan} interval="monthly" />);
    const link = screen.getByRole("link", { name: "getStarted" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("renders 'subscribe' CTA linking to /register for paid plans", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="monthly" />);
    const link = screen.getByRole("link", { name: "subscribe" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("renders 'popular' badge only for pro plan", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={proPlan} interval="monthly" />);
    expect(screen.getByText("popular")).toBeInTheDocument();
  });

  it("does not render 'popular' badge for free or enterprise plans", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    const { unmount } = render(<PricingCard plan={freePlan} interval="monthly" />);
    expect(screen.queryByText("popular")).not.toBeInTheDocument();
    unmount();

    render(<PricingCard plan={enterprisePlan} interval="monthly" />);
    expect(screen.queryByText("popular")).not.toBeInTheDocument();
  });

  it("displays price as 'free' text when price is 0", async () => {
    const { PricingCard } = await import("@/widgets/pricing-table/ui/pricing-card");
    render(<PricingCard plan={freePlan} interval="monthly" />);
    expect(screen.getByText("free")).toBeInTheDocument();
  });
});
