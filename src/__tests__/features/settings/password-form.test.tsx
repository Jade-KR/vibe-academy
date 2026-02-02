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

describe("PasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn();
  });

  it("renders current, new, and confirm password inputs", async () => {
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    expect(screen.getByLabelText("currentPassword")).toBeInTheDocument();
    expect(screen.getByLabelText("newPassword")).toBeInTheDocument();
    expect(screen.getByLabelText("confirmNewPassword")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("shows validation error when current password is empty", async () => {
    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "OldPass1!");
    await user.type(screen.getByLabelText("newPassword"), "NewPass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "DifferentPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when new password equals current", async () => {
    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "SamePass1!");
    await user.type(screen.getByLabelText("newPassword"), "SamePass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "SamePass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/different from current/i)).toBeInTheDocument();
    });
  });

  it("submits and shows success toast on valid input", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "OldPass1!");
    await user.type(screen.getByLabelText("newPassword"), "NewPass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/password",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("shows error toast when API returns error", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
      }),
    });

    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "WrongPass1!");
    await user.type(screen.getByLabelText("newPassword"), "NewPass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Current password is incorrect");
    });
  });

  it("resets form after successful submission", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "OldPass1!");
    await user.type(screen.getByLabelText("newPassword"), "NewPass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByLabelText("currentPassword")).toHaveValue("");
      expect(screen.getByLabelText("newPassword")).toHaveValue("");
      expect(screen.getByLabelText("confirmNewPassword")).toHaveValue("");
    });
  });

  it("disables submit button while loading", async () => {
    let resolvePromise: (v: any) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const user = userEvent.setup();
    const { PasswordForm } = await import("@/features/settings");
    render(<PasswordForm />);

    await user.type(screen.getByLabelText("currentPassword"), "OldPass1!");
    await user.type(screen.getByLabelText("newPassword"), "NewPass1!");
    await user.type(screen.getByLabelText("confirmNewPassword"), "NewPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });
  });
});
