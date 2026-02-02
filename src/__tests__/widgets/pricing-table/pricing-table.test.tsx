import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("PricingTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three plan cards", async () => {
    const { PricingTable } = await import("@/widgets/pricing-table/ui/pricing-table");
    render(<PricingTable />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("defaults to monthly billing interval", async () => {
    const { PricingTable } = await import("@/widgets/pricing-table/ui/pricing-table");
    render(<PricingTable />);
    // Monthly prices should be displayed by default
    expect(screen.getByText(/19,000/)).toBeInTheDocument();
    expect(screen.getByText(/99,000/)).toBeInTheDocument();
  });

  it("switches to yearly prices when toggle is clicked", async () => {
    const user = userEvent.setup();
    const { PricingTable } = await import("@/widgets/pricing-table/ui/pricing-table");
    render(<PricingTable />);

    // Click the yearly toggle (Switch component renders as a button)
    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    // Yearly prices should now be displayed
    expect(screen.getByText(/190,000/)).toBeInTheDocument();
    expect(screen.getByText(/990,000/)).toBeInTheDocument();
  });

  it("shows yearly discount hint when yearly is selected", async () => {
    const user = userEvent.setup();
    const { PricingTable } = await import("@/widgets/pricing-table/ui/pricing-table");
    render(<PricingTable />);

    // Discount hint should not be visible initially
    expect(screen.queryByText("yearlyDiscount")).not.toBeInTheDocument();

    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    expect(screen.getByText("yearlyDiscount")).toBeInTheDocument();
  });

  it("renders toggle labels from i18n", async () => {
    const { PricingTable } = await import("@/widgets/pricing-table/ui/pricing-table");
    render(<PricingTable />);
    expect(screen.getByText("monthly")).toBeInTheDocument();
    expect(screen.getByText("yearly")).toBeInTheDocument();
  });
});
