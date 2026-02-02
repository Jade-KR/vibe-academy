import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
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

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PricingContent component", async () => {
    const { default: PricingPage } = await import("@/app/[locale]/(marketing)/pricing/page");
    render(<PricingPage />);
    // PricingContent renders the pricing title
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("title");
    // And plan cards
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
