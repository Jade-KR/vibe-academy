import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockUseUser = vi.fn();
vi.mock("@/entities/user", () => ({ useUser: () => mockUseUser() }));

describe("WelcomeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when user is loading", async () => {
    mockUseUser.mockReturnValue({ user: null, isLoading: true, error: null });
    const { WelcomeCard } = await import("@/features/dashboard");
    const { container } = render(<WelcomeCard />);
    expect(container.querySelector("[data-testid='welcome-skeleton']")).toBeInTheDocument();
  });

  it("renders user name in greeting when loaded", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { WelcomeCard } = await import("@/features/dashboard");
    render(<WelcomeCard />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "1", name: "Alice", email: "alice@test.com" },
      isLoading: false,
      error: null,
    });
    const { WelcomeCard } = await import("@/features/dashboard");
    render(<WelcomeCard />);
    expect(screen.getByText("subtitle")).toBeInTheDocument();
  });
});
