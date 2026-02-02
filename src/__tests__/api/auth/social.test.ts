import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ---- Mocks ----

const mockSignInWithOAuth = vi.fn();
const mockSupabaseClient = {
  auth: { signInWithOAuth: mockSignInWithOAuth },
};

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
  createAdminClient: vi.fn(),
}));

// ---- Tests ----

describe("GET /api/auth/social/[provider]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to OAuth URL for valid provider (google)", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth?client_id=test" },
      error: null,
    });

    const { GET } = await import("@/app/api/auth/social/[provider]/route");
    const request = new Request(
      "http://localhost:3000/api/auth/social/google",
    ) as unknown as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("accounts.google.com");
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" }),
    );
  });

  it("returns 400 for invalid provider", async () => {
    const { GET } = await import("@/app/api/auth/social/[provider]/route");
    const request = new Request(
      "http://localhost:3000/api/auth/social/twitter",
    ) as unknown as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ provider: "twitter" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_PROVIDER");
  });

  it("works for all 5 supported providers", async () => {
    const providers = ["google", "github", "kakao", "naver", "apple"];
    for (const provider of providers) {
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: `https://${provider}.example.com/oauth` },
        error: null,
      });

      const { GET } = await import("@/app/api/auth/social/[provider]/route");
      const request = new Request(
        `http://localhost:3000/api/auth/social/${provider}`,
      ) as unknown as NextRequest;
      const response = await GET(request, {
        params: Promise.resolve({ provider }),
      });

      expect(response.status).toBe(307);
    }
  });

  it("returns 500 when Supabase signInWithOAuth fails", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: "OAuth provider error" },
    });

    const { GET } = await import("@/app/api/auth/social/[provider]/route");
    const request = new Request(
      "http://localhost:3000/api/auth/social/google",
    ) as unknown as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ provider: "google" }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("OAUTH_ERROR");
  });

  it("returns 500 when signInWithOAuth returns no URL", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: null,
    });

    const { GET } = await import("@/app/api/auth/social/[provider]/route");
    const request = new Request(
      "http://localhost:3000/api/auth/social/google",
    ) as unknown as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ provider: "google" }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("OAUTH_ERROR");
  });
});
