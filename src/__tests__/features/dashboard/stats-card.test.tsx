import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockUseUser = vi.fn();
vi.mock("@/entities/user", () => ({ useUser: () => mockUseUser() }));

describe("StatsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when data is loading", async () => {
    mockUseUser.mockReturnValue({ user: null, isLoading: true, error: null });
    const { StatsCard } = await import("@/features/dashboard");
    const { container } = render(<StatsCard />);
    expect(container.querySelector("[data-testid='stats-skeleton']")).toBeInTheDocument();
  });

  it("renders FREE plan name as default", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { StatsCard } = await import("@/features/dashboard");
    render(<StatsCard />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders plan features list", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { StatsCard } = await import("@/features/dashboard");
    render(<StatsCard />);
    // FREE plan features are rendered from PRICING_PLANS config
    expect(screen.getByText("기본 기능 접근")).toBeInTheDocument();
    expect(screen.getByText("커뮤니티 지원")).toBeInTheDocument();
  });

  it("renders API call and storage limits", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { StatsCard } = await import("@/features/dashboard");
    render(<StatsCard />);
    // Translation mock returns key:params, so we check the translated limit keys
    expect(screen.getByText('perMonth:{"count":100}')).toBeInTheDocument();
    expect(screen.getByText('mb:{"count":100}')).toBeInTheDocument();
  });
});
