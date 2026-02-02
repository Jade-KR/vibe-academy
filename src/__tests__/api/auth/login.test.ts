import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockSignInWithPassword = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { signInWithPassword: mockSignInWithPassword },
  }),
}));

// ---- Tests ----

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns user data on valid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@test.com" } },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createMockRequest("POST", {
      email: "user@test.com",
      password: "validpassword",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe("user@test.com");
  });

  it("returns 401 on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createMockRequest("POST", {
      email: "user@test.com",
      password: "wrongpassword",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 400 on validation error (missing email)", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const request = createMockRequest("POST", { password: "something" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 when rate limited", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    // Exhaust rate limit (10 attempts)
    for (let i = 0; i < 10; i++) {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid" },
      });
      const req = createMockRequest("POST", {
        email: "ratelimited@test.com",
        password: "wrong",
      });
      await POST(req);
    }

    // 11th request should be rate limited
    const request = createMockRequest("POST", {
      email: "ratelimited@test.com",
      password: "wrong",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("returns 500 on internal error", async () => {
    mockSignInWithPassword.mockImplementation(() => {
      throw new Error("DB down");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createMockRequest("POST", {
      email: "user@test.com",
      password: "validpassword",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");

    consoleSpy.mockRestore();
  });

  it("normalizes email to lowercase for rate limiting", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u1", email: "user@test.com" } },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const request = createMockRequest("POST", {
      email: "User@Test.COM",
      password: "validpassword",
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    // The signInWithPassword is called with original email
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "User@Test.COM",
      password: "validpassword",
    });
  });
});
