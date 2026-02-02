import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockUpdateUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    signInWithPassword: mockSignInWithPassword,
    updateUser: mockUpdateUser,
  },
};

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
}));

// Drizzle mock chain
const mockSelectWhereResult = vi.fn();
const mockSelectFrom = vi.fn().mockImplementation(() => ({
  where: vi.fn().mockImplementation(() => mockSelectWhereResult()),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: mockSelectFrom,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
}));

// Mock rate limiter
const mockIsLimited = vi.fn().mockReturnValue(false);
vi.mock("@/shared/lib/rate-limit", () => ({
  createRateLimiter: vi.fn().mockReturnValue({
    isLimited: mockIsLimited,
  }),
}));

// ---- Test data ----

const TEST_SUPABASE_USER = {
  id: "supabase-user-123",
  email: "test@example.com",
};

const TEST_DB_USER = {
  email: "test@example.com",
};

const VALID_BODY = {
  currentPassword: "OldPass1!",
  newPassword: "NewPass1!",
  confirmNewPassword: "NewPass1!",
};

// ---- Tests ----

describe("POST /api/user/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLimited.mockReturnValue(false);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 with Zod error when body is invalid (missing fields)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_SUPABASE_USER }, error: null });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", { currentPassword: "test" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when passwords don't match", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_SUPABASE_USER }, error: null });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", {
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
      confirmNewPassword: "Different1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when newPassword is same as currentPassword", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_SUPABASE_USER }, error: null });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", {
      currentPassword: "SamePass1!",
      newPassword: "SamePass1!",
      confirmNewPassword: "SamePass1!",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when newPassword fails strength rules", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_SUPABASE_USER }, error: null });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", {
      currentPassword: "OldPass1!",
      newPassword: "weak",
      confirmNewPassword: "weak",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when currentPassword is wrong", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_PASSWORD");
  });

  it("returns 200 on successful password change", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER, session: {} },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("Password changed");
  });

  it("calls signInWithPassword with user email + currentPassword", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER, session: {} },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    await POST(request);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: TEST_DB_USER.email,
      password: VALID_BODY.currentPassword,
    });
  });

  it("calls updateUser with new password after verification", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER, session: {} },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    await POST(request);

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: VALID_BODY.newPassword,
    });
  });

  it("returns 429 when rate limited", async () => {
    mockIsLimited.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { POST } = await import("@/app/api/user/password/route");
    const request = createMockRequest("POST", VALID_BODY);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
  });
});
