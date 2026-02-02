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

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    delete (window as any).location;
    (window as any).location = { ...window.location, href: "" };
  });

  it("renders email, password, confirm password, name, and submit", async () => {
    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("password")).toBeInTheDocument();
    expect(screen.getByLabelText("confirmPassword")).toBeInTheDocument();
    expect(screen.getByLabelText("name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "weak");
    await user.type(screen.getByLabelText("confirmPassword"), "weak");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "StrongPass1!");
    await user.type(screen.getByLabelText("confirmPassword"), "Different1!");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid data and redirects", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: "1", email: "user@example.com", name: "Test" } },
      }),
    });

    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "StrongPass1!");
    await user.type(screen.getByLabelText("confirmPassword"), "StrongPass1!");
    await user.type(screen.getByLabelText("name"), "Test User");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith("/verify-email");
    });
  });

  it("renders social login buttons", async () => {
    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows link to login page", async () => {
    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    expect(screen.getByText("login")).toBeInTheDocument();
  });

  it("allows registration without name (optional field)", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: "1", email: "user@example.com" } },
      }),
    });

    const { RegisterForm } = await import("@/features/auth/register");
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("email"), "user@example.com");
    await user.type(screen.getByLabelText("password"), "StrongPass1!");
    await user.type(screen.getByLabelText("confirmPassword"), "StrongPass1!");
    // Skip name field
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
