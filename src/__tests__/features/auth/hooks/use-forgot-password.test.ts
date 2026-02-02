import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockForgotPassword = vi.fn();
const mockToastError = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { error: mockToastError, success: vi.fn() },
}));
vi.mock("@/features/auth/forgot-password/api/forgot-password", () => ({
  forgotPassword: mockForgotPassword,
}));

describe("useForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets isSent to true on success", async () => {
    mockForgotPassword.mockResolvedValue({ success: true });
    const { useForgotPassword } = await import(
      "@/features/auth/forgot-password/model/use-forgot-password"
    );
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.isSent).toBe(false);

    await act(async () => {
      await result.current.handleForgotPassword({ email: "user@test.com" });
    });

    expect(result.current.isSent).toBe(true);
  });

  it("shows toast error on API error", async () => {
    mockForgotPassword.mockResolvedValue({ success: false, error: { message: "Rate limited" } });
    const { useForgotPassword } = await import(
      "@/features/auth/forgot-password/model/use-forgot-password"
    );
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword({ email: "user@test.com" });
    });

    expect(mockToastError).toHaveBeenCalledWith("Rate limited");
  });

  it("shows unexpected error toast on thrown error", async () => {
    mockForgotPassword.mockRejectedValue(new Error("Network error"));
    const { useForgotPassword } = await import(
      "@/features/auth/forgot-password/model/use-forgot-password"
    );
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword({ email: "user@test.com" });
    });

    expect(mockToastError).toHaveBeenCalledWith("unexpectedError");
  });

  it("manages loading state correctly", async () => {
    let resolve: (v: unknown) => void;
    mockForgotPassword.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { useForgotPassword } = await import(
      "@/features/auth/forgot-password/model/use-forgot-password"
    );
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleForgotPassword({ email: "u@t.com" });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!({ success: true });
      await promise!;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
