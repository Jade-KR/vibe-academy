import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("getAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when authenticated", async () => {
    const mockUser = { id: "user-123", email: "user@test.com" };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { getAuthenticatedUser } = await import("@/shared/lib/api/auth");
    const result = await getAuthenticatedUser();

    expect(result.user).toEqual(mockUser);
    expect(result.supabase).toBeDefined();
  });

  it("returns null user when getUser returns error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Session expired" },
    });

    const { getAuthenticatedUser } = await import("@/shared/lib/api/auth");
    const result = await getAuthenticatedUser();

    expect(result.user).toBeNull();
    expect(result.supabase).toBeDefined();
  });

  it("returns null user when no user in session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { getAuthenticatedUser } = await import("@/shared/lib/api/auth");
    const result = await getAuthenticatedUser();

    expect(result.user).toBeNull();
  });

  it("always returns supabase client", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { getAuthenticatedUser } = await import("@/shared/lib/api/auth");
    const result = await getAuthenticatedUser();

    expect(result.supabase).toBeDefined();
    expect(result.supabase.auth).toBeDefined();
  });
});
