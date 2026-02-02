import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockResetPasswordForEmail = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  }),
}));

// ---- Tests ----

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns success with message on valid email", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("reset link");
    expect(mockResetPasswordForEmail).toHaveBeenCalled();
  });

  it("returns 400 on invalid email", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const request = createMockRequest("POST", { email: "not-an-email" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 200 even when rate limited (enumeration prevention)", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Exhaust rate limit (5 attempts per hour)
    for (let i = 0; i < 5; i++) {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const req = createMockRequest("POST", { email: "user@test.com" });
      await POST(req);
    }

    // 6th request should be rate limited but still return 200
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    consoleSpy.mockRestore();
  });

  it("returns 200 even on internal error (enumeration prevention)", async () => {
    mockResetPasswordForEmail.mockImplementation(() => {
      throw new Error("DB down");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    consoleSpy.mockRestore();
  });
});
