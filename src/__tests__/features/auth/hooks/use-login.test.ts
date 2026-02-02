import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockLogin = vi.fn();
const mockToastError = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("sonner", () => ({
  toast: { error: mockToastError, success: vi.fn() },
}));
vi.mock("@/features/auth/login/api/login", () => ({
  login: mockLogin,
}));

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /dashboard on success", async () => {
    mockLogin.mockResolvedValue({ success: true });
    const { useLogin } = await import("@/features/auth/login/model/use-login");
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: "user@test.com", password: "Pass1!" });
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows toast error on API error", async () => {
    mockLogin.mockResolvedValue({ success: false, error: { message: "Invalid credentials" } });
    const { useLogin } = await import("@/features/auth/login/model/use-login");
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: "user@test.com", password: "wrong" });
    });

    expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows unexpected error toast on thrown error", async () => {
    mockLogin.mockRejectedValue(new Error("Network error"));
    const { useLogin } = await import("@/features/auth/login/model/use-login");
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: "user@test.com", password: "pass" });
    });

    expect(mockToastError).toHaveBeenCalledWith("unexpectedError");
  });

  it("manages loading state correctly", async () => {
    let resolve: (v: unknown) => void;
    mockLogin.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { useLogin } = await import("@/features/auth/login/model/use-login");
    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleLogin({ email: "u@t.com", password: "p" });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!({ success: true });
      await promise!;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
