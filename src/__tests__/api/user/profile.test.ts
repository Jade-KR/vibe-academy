import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
};

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
  createAdminClient: vi.fn(),
}));

// Drizzle mock chain
const mockWhereResult = vi.fn();
const mockReturning = vi.fn();
const mockWhere = vi.fn().mockImplementation(() => mockWhereResult());
const mockUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockReturning,
}));
const mockSet = vi.fn().mockImplementation(() => ({
  where: mockUpdateWhere,
}));
const mockFrom = vi.fn().mockImplementation(() => ({
  where: mockWhere,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: mockFrom,
    })),
    update: vi.fn().mockImplementation(() => ({
      set: mockSet,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
}));

// ---- Test data ----

const TEST_SUPABASE_USER = {
  id: "supabase-user-123",
  email: "test@example.com",
};

const TEST_DB_USER = {
  id: "db-user-456",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  locale: "ko",
  createdAt: new Date("2025-01-01"),
};

// ---- Tests ----

describe("GET /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { GET } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when user not found in DB", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockWhereResult.mockReturnValue([]);

    const { GET } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 200 with user profile data", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockWhereResult.mockReturnValue([TEST_DB_USER]);

    const { GET } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      id: TEST_DB_USER.id,
      email: TEST_DB_USER.email,
      name: TEST_DB_USER.name,
      locale: TEST_DB_USER.locale,
    });
  });

  it("does NOT return supabaseUserId in response", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockWhereResult.mockReturnValue([TEST_DB_USER]);

    const { GET } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.supabaseUserId).toBeUndefined();
  });
});

describe("PATCH /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { name: "New Name" });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 with Zod error when body is empty object", async () => {
    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", {});
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 with Zod error when name exceeds 100 chars", async () => {
    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { name: "a".repeat(101) });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 with Zod error when locale is invalid", async () => {
    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { locale: "fr" });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 and updates name only", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    const updatedUser = { ...TEST_DB_USER, name: "Updated Name" };
    mockReturning.mockResolvedValue([updatedUser]);

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { name: "Updated Name" });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Updated Name");
  });

  it("returns 200 and updates locale only", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    const updatedUser = { ...TEST_DB_USER, locale: "en" };
    mockReturning.mockResolvedValue([updatedUser]);

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { locale: "en" });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.locale).toBe("en");
  });

  it("returns 200 and updates both name and locale", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    const updatedUser = { ...TEST_DB_USER, name: "New Name", locale: "en" };
    mockReturning.mockResolvedValue([updatedUser]);

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", {
      name: "New Name",
      locale: "en",
    });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("New Name");
    expect(body.data.locale).toBe("en");
  });

  it("sets updatedAt to current timestamp on update", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockReturning.mockResolvedValue([TEST_DB_USER]);

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { name: "Test" });
    await PATCH(request);

    // Verify that set() was called with updatedAt as a Date
    expect(mockSet).toHaveBeenCalled();
    const setArg = mockSet.mock.calls[0][0];
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it("returns 404 when user not found in DB", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockReturning.mockResolvedValue([]);

    const { PATCH } = await import("@/app/api/user/profile/route");
    const request = createMockRequest("PATCH", { name: "Test" });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
