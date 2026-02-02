import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResetPassword = vi.fn();
const mockToastError = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { error: mockToastError, success: vi.fn() },
}));
vi.mock("@/features/auth/reset-password/api/reset-password", () => ({
  resetPassword: mockResetPassword,
}));

describe("useResetPassword", () => {
  const validData = { password: "Abcdef1!", confirmPassword: "Abcdef1!" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets isSuccess to true on success", async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    const { useResetPassword } = await import(
      "@/features/auth/reset-password/model/use-reset-password"
    );
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      await result.current.handleResetPassword(validData);
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it("shows toast error on API error", async () => {
    mockResetPassword.mockResolvedValue({ success: false, error: { message: "Token expired" } });
    const { useResetPassword } = await import(
      "@/features/auth/reset-password/model/use-reset-password"
    );
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.handleResetPassword(validData);
    });

    expect(mockToastError).toHaveBeenCalledWith("Token expired");
  });

  it("shows unexpected error toast on thrown error", async () => {
    mockResetPassword.mockRejectedValue(new Error("Network error"));
    const { useResetPassword } = await import(
      "@/features/auth/reset-password/model/use-reset-password"
    );
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.handleResetPassword(validData);
    });

    expect(mockToastError).toHaveBeenCalledWith("unexpectedError");
  });

  it("manages loading state correctly", async () => {
    let resolve: (v: unknown) => void;
    mockResetPassword.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { useResetPassword } = await import(
      "@/features/auth/reset-password/model/use-reset-password"
    );
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleResetPassword(validData);
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!({ success: true });
      await promise!;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
