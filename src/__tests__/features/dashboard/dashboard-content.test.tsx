import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUseUser = vi.fn();
vi.mock("@/entities/user", () => ({ useUser: () => mockUseUser() }));

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three dashboard sections", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { DashboardContent } = await import("@/features/dashboard");
    render(<DashboardContent />);

    // WelcomeCard greeting (contains name)
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    // StatsCard plan name
    expect(screen.getByText("Free")).toBeInTheDocument();
    // QuickActions buttons
    expect(screen.getByText("editProfile")).toBeInTheDocument();
  });

  it("renders loading skeletons when data is loading", async () => {
    mockUseUser.mockReturnValue({ user: null, isLoading: true, error: null });
    const { DashboardContent } = await import("@/features/dashboard");
    const { container } = render(<DashboardContent />);
    expect(container.querySelector("[data-testid='welcome-skeleton']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='stats-skeleton']")).toBeInTheDocument();
  });
});
