import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    if (params?.provider) return `Continue with ${params.provider}`;
    return key;
  },
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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    delete (window as any).location;
    (window as any).location = { ...window.location, href: "" };
  });

  it("renders email, password, remember me, and submit button", async () => {
    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("password")).toBeInTheDocument();
    expect(screen.getByLabelText("rememberMe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    await user.type(screen.getByLabelText("email"), "not-valid");
    await user.type(screen.getByLabelText("password"), "somepassword");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid credentials and redirects", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: "1", email: "user@example.com" } },
      }),
    });

    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders social login buttons", async () => {
    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
  });

  it("renders forgot password and register links", async () => {
    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    expect(screen.getByText("forgotPassword")).toBeInTheDocument();
    expect(screen.getByText("register")).toBeInTheDocument();
  });

  it("disables submit and social buttons while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: (v: any) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { LoginForm } = await import("@/features/auth/login");
    render(<LoginForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { user: { id: "1", email: "user@example.com" } } }),
    });
  });
});
