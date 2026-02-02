import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
  }),
}));

// ---- Tests ----

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success on valid password reset", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = createMockRequest("POST", {
      password: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("Password updated");
  });

  it("returns 400 on invalid password format", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = createMockRequest("POST", {
      password: "weak",
      confirmPassword: "weak",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when no valid session (invalid token)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Session expired" },
    });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = createMockRequest("POST", {
      password: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 400 when updateUser fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: { message: "Password too weak" } });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = createMockRequest("POST", {
      password: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("AUTH_ERROR");
  });

  it("returns 500 on internal error", async () => {
    mockGetUser.mockImplementation(() => {
      throw new Error("DB down");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = createMockRequest("POST", {
      password: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");

    consoleSpy.mockRestore();
  });
});
