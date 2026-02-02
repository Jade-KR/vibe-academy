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

describe("QuickActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section title", async () => {
    const { QuickActions } = await import("@/features/dashboard");
    render(<QuickActions />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("renders Edit Profile button linking to /dashboard/settings/profile", async () => {
    const { QuickActions } = await import("@/features/dashboard");
    render(<QuickActions />);
    const link = screen.getByText("editProfile").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/settings/profile");
  });

  it("renders Account Settings button linking to /dashboard/settings/account", async () => {
    const { QuickActions } = await import("@/features/dashboard");
    render(<QuickActions />);
    const link = screen.getByText("accountSettings").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/settings/account");
  });

  it("renders View Pricing button linking to /pricing", async () => {
    const { QuickActions } = await import("@/features/dashboard");
    render(<QuickActions />);
    const link = screen.getByText("viewPricing").closest("a");
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
