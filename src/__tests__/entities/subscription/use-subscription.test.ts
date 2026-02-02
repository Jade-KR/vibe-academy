import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock SWR
const mockUseSWR = vi.fn();
vi.mock("swr", () => ({ default: mockUseSWR }));

describe("useSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null subscription and isLoading true when loading", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.subscription).toBeNull();
    expect(result.isLoading).toBe(true);
    expect(result.isPro).toBe(false);
  });

  it("returns subscription data on success", async () => {
    const mockSub = { planId: "pro", status: "active" };
    mockUseSWR.mockReturnValue({
      data: { data: mockSub },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.subscription).toEqual(mockSub);
    expect(result.isLoading).toBe(false);
  });

  it('isPro is true when planId is "pro"', async () => {
    mockUseSWR.mockReturnValue({
      data: { data: { planId: "pro", status: "active" } },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.isPro).toBe(true);
  });

  it('isPro is true when planId is "enterprise"', async () => {
    mockUseSWR.mockReturnValue({
      data: { data: { planId: "enterprise", status: "active" } },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.isPro).toBe(true);
  });

  it('isPro is false when planId is "free"', async () => {
    mockUseSWR.mockReturnValue({
      data: { data: { planId: "free", status: "active" } },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.isPro).toBe(false);
  });

  it("isPro is false when no data", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.isPro).toBe(false);
  });

  it("returns error state", async () => {
    const mockError = new Error("Network error");
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(result.error).toBeTruthy();
  });

  it("exposes mutate function", async () => {
    const mockMutate = vi.fn();
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    const result = useSubscription();

    expect(typeof result.mutate).toBe("function");
  });

  it("calls useSWR with correct key", async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useSubscription } = await import("@/entities/subscription/api/use-subscription");
    useSubscription();

    expect(mockUseSWR).toHaveBeenCalledWith("/api/payments/subscription");
  });
});
