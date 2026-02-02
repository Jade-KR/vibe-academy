import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks ----

const mockSignOut = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { signOut: mockSignOut },
  }),
}));

// ---- Tests ----

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 on successful sign out", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Logged out successfully");
  });

  it("returns 500 when signOut fails", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "Sign out failed" } });

    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("AUTH_ERROR");
  });

  it("returns 500 on internal error", async () => {
    mockSignOut.mockImplementation(() => {
      throw new Error("Unexpected failure");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");

    consoleSpy.mockRestore();
  });
});
