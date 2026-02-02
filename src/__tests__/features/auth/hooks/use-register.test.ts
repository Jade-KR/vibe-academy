import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockRegister = vi.fn();
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
vi.mock("@/features/auth/register/api/register", () => ({
  register: mockRegister,
}));

describe("useRegister", () => {
  const validData = {
    email: "user@test.com",
    password: "Abcdef1!",
    confirmPassword: "Abcdef1!",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /verify-email on success", async () => {
    mockRegister.mockResolvedValue({ success: true });
    const { useRegister } = await import("@/features/auth/register/model/use-register");
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.handleRegister(validData);
    });

    expect(mockPush).toHaveBeenCalledWith("/verify-email");
  });

  it("shows toast error on API error", async () => {
    mockRegister.mockResolvedValue({ success: false, error: { message: "Email taken" } });
    const { useRegister } = await import("@/features/auth/register/model/use-register");
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.handleRegister(validData);
    });

    expect(mockToastError).toHaveBeenCalledWith("Email taken");
  });

  it("shows unexpected error toast on thrown error", async () => {
    mockRegister.mockRejectedValue(new Error("Network error"));
    const { useRegister } = await import("@/features/auth/register/model/use-register");
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.handleRegister(validData);
    });

    expect(mockToastError).toHaveBeenCalledWith("unexpectedError");
  });

  it("manages loading state correctly", async () => {
    let resolve: (v: unknown) => void;
    mockRegister.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { useRegister } = await import("@/features/auth/register/model/use-register");
    const { result } = renderHook(() => useRegister());

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleRegister(validData);
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve!({ success: true });
      await promise!;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
