import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockIdentities = [
  { id: "id-1", identityId: "google-123", provider: "google", createdAt: "2026-01-01T00:00:00Z" },
  { id: "id-2", identityId: "github-456", provider: "github", createdAt: "2026-01-02T00:00:00Z" },
];

describe("ConnectedAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn();
    delete (window as any).location;
    (window as any).location = { ...window.location, href: "" };
  });

  it("renders all 5 social providers", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getByText("google")).toBeInTheDocument();
      expect(screen.getByText("github")).toBeInTheDocument();
      expect(screen.getByText("kakao")).toBeInTheDocument();
      expect(screen.getByText("naver")).toBeInTheDocument();
      expect(screen.getByText("apple")).toBeInTheDocument();
    });
  });

  it("shows Connected badge for linked providers", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      const badges = screen.getAllByText("connected");
      expect(badges.length).toBe(2); // google and github
    });
  });

  it("shows Connect button for unlinked providers", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      const connectButtons = screen.getAllByRole("button", { name: "connect" });
      expect(connectButtons.length).toBe(3); // kakao, naver, apple
    });
  });

  it("shows Disconnect button for linked providers", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      const disconnectButtons = screen.getAllByRole("button", { name: "disconnect" });
      expect(disconnectButtons.length).toBe(2); // google and github
    });
  });

  it("calls disconnect API on disconnect click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const user = userEvent.setup();
    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "disconnect" }).length).toBe(2);
    });

    // Mock the DELETE call
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    const disconnectButtons = screen.getAllByRole("button", { name: "disconnect" });
    await user.click(disconnectButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/identities",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  it("redirects to OAuth flow on connect click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: [] } }),
    });

    const user = userEvent.setup();
    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "connect" }).length).toBe(5);
    });

    // Click the first connect button (google)
    const connectButtons = screen.getAllByRole("button", { name: "connect" });
    await user.click(connectButtons[0]);

    expect(window.location.href).toBe("/api/auth/social/google");
  });

  it("shows error toast on disconnect failure", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: mockIdentities } }),
    });

    const user = userEvent.setup();
    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "disconnect" }).length).toBe(2);
    });

    // Mock the DELETE to fail
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: { code: "ERROR", message: "Disconnect failed" },
      }),
    });

    const disconnectButtons = screen.getAllByRole("button", { name: "disconnect" });
    await user.click(disconnectButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("prevents disconnect when only one identity remains", async () => {
    const { toast } = await import("sonner");
    const singleIdentity = [mockIdentities[0]];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { identities: singleIdentity } }),
    });

    const user = userEvent.setup();
    const { ConnectedAccounts } = await import("@/features/settings");
    render(<ConnectedAccounts />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "disconnect" }).length).toBe(1);
    });

    const disconnectButton = screen.getByRole("button", { name: "disconnect" });
    await user.click(disconnectButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("lastIdentity");
    });
  });
});
