import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockResend = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { resend: mockResend },
  }),
}));

// ---- Tests ----

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns success on valid email", async () => {
    mockResend.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("verification email");
    expect(mockResend).toHaveBeenCalledWith({
      type: "signup",
      email: "user@test.com",
    });
  });

  it("returns 400 on invalid email", async () => {
    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const request = createMockRequest("POST", { email: "not-valid" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 429 when rate limited", async () => {
    const { POST } = await import("@/app/api/auth/resend-verification/route");

    // Exhaust rate limit (5 attempts per 15 minutes)
    for (let i = 0; i < 5; i++) {
      mockResend.mockResolvedValue({ error: null });
      const req = createMockRequest("POST", { email: "user@test.com" });
      await POST(req);
    }

    // 6th request should be rate limited
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("returns 200 on internal error (enumeration prevention)", async () => {
    mockResend.mockImplementation(() => {
      throw new Error("Service down");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const request = createMockRequest("POST", { email: "user@test.com" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    consoleSpy.mockRestore();
  });
});
