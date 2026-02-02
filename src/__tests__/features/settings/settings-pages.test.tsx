import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: any[]) => {
    mockRedirect(...args);
    // Throw to stop execution like real redirect does
    throw new Error("NEXT_REDIRECT");
  },
}));

function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>,
  );
}

describe("Settings Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "user-1",
          email: "user@example.com",
          name: "Test",
          avatarUrl: null,
          locale: "en",
          createdAt: "2026-01-01T00:00:00Z",
        },
      }),
    });
  });

  it("settings index redirects to /dashboard/settings/profile", async () => {
    const { default: SettingsPage } =
      await import("@/app/[locale]/(dashboard)/dashboard/settings/page");

    await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/en/dashboard/settings/profile");
  });

  it("profile page renders ProfileForm and AvatarUpload", async () => {
    const { default: ProfileSettingsPage } =
      await import("@/app/[locale]/(dashboard)/dashboard/settings/profile/page");

    renderWithSWR(<ProfileSettingsPage />);

    // Both components render cards with their titles
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("account page renders PasswordForm and ConnectedAccounts", async () => {
    const { default: AccountSettingsPage } =
      await import("@/app/[locale]/(dashboard)/dashboard/settings/account/page");

    renderWithSWR(<AccountSettingsPage />);

    // PasswordForm renders its card
    expect(screen.getByText("title")).toBeInTheDocument();
  });
});
