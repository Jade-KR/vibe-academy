import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
const mockPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders password and confirm password inputs", async () => {
    const { ResetPasswordForm } = await import("@/features/auth/reset-password");
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText("password")).toBeInTheDocument();
    expect(screen.getByLabelText("confirmPassword")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    const { ResetPasswordForm } = await import("@/features/auth/reset-password");
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("password"), "Password1!");
    await user.type(screen.getByLabelText("confirmPassword"), "Different1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    const { ResetPasswordForm } = await import("@/features/auth/reset-password");
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("password"), "short");
    await user.type(screen.getByLabelText("confirmPassword"), "short");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("submits and redirects on success", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    const { ResetPasswordForm } = await import("@/features/auth/reset-password");
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("password"), "StrongPass1!");
    await user.type(screen.getByLabelText("confirmPassword"), "StrongPass1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
    });
  });
});
