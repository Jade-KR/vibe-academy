import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

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

const mockProfile = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  avatarUrl: null,
  locale: "en",
  createdAt: "2026-01-01T00:00:00Z",
};

/** Wraps component with clean SWR cache to avoid cross-test pollution. */
function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>,
  );
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn();
  });

  it("renders name input and locale select", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockProfile }),
    });

    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });
  });

  it("shows validation error when name exceeds 100 chars", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockProfile }),
    });

    const user = userEvent.setup();
    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("name");
    await user.clear(nameInput);
    await user.type(nameInput, "a".repeat(101));
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  it("submits updated profile and shows success toast", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockProfile, name: "Updated Name" },
      }),
    });

    const user = userEvent.setup();
    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("shows error toast on API error", async () => {
    const { toast } = await import("sonner");

    // First call (SWR initial fetch): succeed
    // Second call (PATCH from updateProfile): fail
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (_url: string, options?: RequestInit) => {
        if (!options?.method || options.method === "GET") {
          return {
            ok: true,
            json: async () => ({ success: true, data: mockProfile }),
          };
        }
        // PATCH call
        return {
          ok: true,
          json: async () => ({
            success: false,
            error: { code: "ERROR", message: "Update failed" },
          }),
        };
      },
    );

    const user = userEvent.setup();
    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("name");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("disables submit button while submitting", async () => {
    // SWR initial fetch resolves immediately
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockProfile }),
    });

    const user = userEvent.setup();
    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    // Now make the PATCH call hang so isSubmitting stays true
    let resolvePromise: (v: any) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const nameInput = screen.getByLabelText("name");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockProfile, name: "New Name" },
      }),
    });
  });

  it("shows loading skeleton while SWR is fetching", async () => {
    // Make fetch never resolve to keep SWR in loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const { ProfileForm } = await import("@/features/settings");
    renderWithSWR(<ProfileForm />);

    // Should show skeleton immediately since SWR data is undefined
    expect(screen.getByTestId("profile-form-skeleton")).toBeInTheDocument();
  });
});
