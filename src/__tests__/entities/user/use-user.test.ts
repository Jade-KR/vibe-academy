import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock SWR
const mockUseSWR = vi.fn();
vi.mock("swr", () => ({ default: mockUseSWR }));

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state initially", async () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: true });
    const { useUser } = await import("@/entities/user");
    const { result } = renderHook(() => useUser());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("returns user data on success", async () => {
    const mockUser = { id: "1", name: "Test", email: "test@test.com" };
    mockUseSWR.mockReturnValue({
      data: { data: mockUser },
      error: undefined,
      isLoading: false,
    });
    const { useUser } = await import("@/entities/user");
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns error state on failure", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error("fetch failed"),
      isLoading: false,
    });
    const { useUser } = await import("@/entities/user");
    const { result } = renderHook(() => useUser());
    expect(result.current.error).toBeTruthy();
    expect(result.current.user).toBeNull();
  });

  it("calls useSWR with /api/user/profile", async () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: true });
    const { useUser } = await import("@/entities/user");
    renderHook(() => useUser());
    expect(mockUseSWR).toHaveBeenCalledWith("/api/user/profile");
  });
});
