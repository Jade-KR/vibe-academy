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

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders email input and submit button", async () => {
    const { ForgotPasswordForm } = await import("@/features/auth/forgot-password");
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    const { ForgotPasswordForm } = await import("@/features/auth/forgot-password");
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("submits form and shows success state", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null, message: "Sent" }),
    });

    const { ForgotPasswordForm } = await import("@/features/auth/forgot-password");
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText("sent")).toBeInTheDocument();
    });
  });

  it("shows back to login link", async () => {
    const { ForgotPasswordForm } = await import("@/features/auth/forgot-password");
    render(<ForgotPasswordForm />);

    expect(screen.getByText("backToLogin")).toBeInTheDocument();
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: (v: any) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { ForgotPasswordForm } = await import("@/features/auth/forgot-password");
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();

    // Cleanup
    resolvePromise!({ ok: true, json: async () => ({ success: true, data: null }) });
  });
});
