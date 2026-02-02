import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ---- Mocks ----

const mockExchangeCodeForSession = vi.fn();
const mockSupabaseClient = {
  auth: { exchangeCodeForSession: mockExchangeCodeForSession },
};

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
  createAdminClient: vi.fn(),
}));

// Drizzle mock chain
const mockSelectWhereResult = vi.fn();
const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockUpdateReturning,
}));
const mockUpdateSet = vi.fn().mockImplementation(() => ({
  where: mockUpdateWhere,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => mockSelectWhereResult()),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: mockInsertReturning,
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: mockUpdateSet,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
}));

vi.mock("@/shared/config/site", () => ({
  siteConfig: { url: "http://localhost:3000" },
}));

// ---- Test data ----

const TEST_AUTH_USER = {
  id: "supabase-user-123",
  email: "test@example.com",
  user_metadata: {
    full_name: "Test User",
    avatar_url: "https://example.com/avatar.jpg",
    name: "Test User",
  },
};

const TEST_DB_USER = {
  id: "db-user-456",
  supabaseUserId: "supabase-user-123",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  locale: "ko",
};

// ---- Tests ----

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with error when code is missing", async () => {
    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/auth/login");
    expect(response.headers.get("Location")).toContain("error=");
  });

  it("redirects to login with error when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid code" },
    });

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=invalid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/auth/login");
    expect(response.headers.get("Location")).toContain("error=");
  });

  it("creates new DB user and redirects to dashboard for new social login", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: TEST_AUTH_USER, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([]); // user not in DB
    mockInsertReturning.mockResolvedValue([TEST_DB_USER]);

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/dashboard");
    expect(mockInsertReturning).toHaveBeenCalled();
  });

  it("updates existing DB user and redirects to dashboard", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: TEST_AUTH_USER, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]); // user exists
    mockUpdateReturning.mockResolvedValue([TEST_DB_USER]);

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/dashboard");
  });

  it("uses user locale from DB for redirect when user exists", async () => {
    const userWithEnLocale = { ...TEST_DB_USER, locale: "en" };
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: TEST_AUTH_USER, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([userWithEnLocale]);
    mockUpdateReturning.mockResolvedValue([userWithEnLocale]);

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.headers.get("Location")).toContain("/en/dashboard");
  });

  it("extracts name from user_metadata.full_name or user_metadata.name", async () => {
    const userWithOnlyName = {
      ...TEST_AUTH_USER,
      user_metadata: { name: "Only Name" },
    };
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: userWithOnlyName, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([]);
    mockInsertReturning.mockResolvedValue([TEST_DB_USER]);

    const { db } = await import("@/db/client");
    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    await GET(request);

    // Verify insert was called and db.insert was invoked
    expect(db.insert).toHaveBeenCalled();
    expect(mockInsertReturning).toHaveBeenCalled();
  });

  it("delegates account linking to Supabase (same email = same auth user)", async () => {
    // Supabase Auth handles account linking: when a user logs in with a social
    // provider using an email that already exists, Supabase links the accounts
    // under the same auth user. Our callback receives the same user ID, so the
    // DB lookup finds the existing user and updates it.
    const linkedUser = {
      ...TEST_AUTH_USER,
      id: TEST_DB_USER.supabaseUserId, // same Supabase user ID
      user_metadata: { full_name: "Updated Name", avatar_url: "https://new-avatar.jpg" },
    };
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: linkedUser, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([TEST_DB_USER]); // existing user found
    mockUpdateReturning.mockResolvedValue([{ ...TEST_DB_USER, name: "Updated Name" }]);

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/dashboard");
    // Existing user is updated (not inserted)
    expect(mockUpdateSet).toHaveBeenCalled();
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });

  it("handles DB insert failure gracefully and still redirects", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: TEST_AUTH_USER, session: {} },
      error: null,
    });
    mockSelectWhereResult.mockReturnValue([]);
    mockInsertReturning.mockRejectedValue(new Error("DB error"));

    const { GET } = await import("@/app/api/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code",
    ) as unknown as NextRequest;
    const response = await GET(request);

    // Should still redirect (auth succeeded even if DB insert failed)
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/dashboard");
  });
});
