import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockUnlinkIdentity = vi.fn();

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      unlinkIdentity: mockUnlinkIdentity,
    },
  }),
}));

// ---- Tests ----

const mockUser = { id: "user-123", email: "user@test.com" };
const mockIdentities = [
  { id: "id-1", identity_id: "identity-1", provider: "google", created_at: "2025-01-01" },
  { id: "id-2", identity_id: "identity-2", provider: "github", created_at: "2025-01-02" },
];

describe("GET /api/user/identities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped identities for authenticated user", async () => {
    // First call from getAuthenticatedUser, second from route handler
    mockGetUser
      .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      .mockResolvedValueOnce({
        data: { user: { ...mockUser, identities: mockIdentities } },
        error: null,
      });

    const { GET } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.identities).toHaveLength(2);
    expect(body.data.identities[0]).toEqual({
      id: "id-1",
      identityId: "identity-1",
      provider: "google",
      createdAt: "2025-01-01",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const { GET } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 500 when getUser fails after auth check", async () => {
    mockGetUser
      .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      .mockResolvedValueOnce({ data: { user: null }, error: { message: "Failed" } });

    const { GET } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("AUTH_ERROR");
  });

  it("returns 500 on internal error", async () => {
    mockGetUser.mockImplementation(() => {
      throw new Error("DB down");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { GET } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");

    consoleSpy.mockRestore();
  });
});

describe("DELETE /api/user/identities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully unlinks an identity", async () => {
    mockGetUser
      .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      .mockResolvedValueOnce({
        data: { user: { ...mockUser, identities: mockIdentities } },
        error: null,
      });
    mockUnlinkIdentity.mockResolvedValue({ error: null });

    const { DELETE } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("DELETE", { identityId: "identity-1" });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("disconnected");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const { DELETE } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("DELETE", { identityId: "identity-1" });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("prevents deleting last identity", async () => {
    const singleIdentity = [mockIdentities[0]];
    mockGetUser
      .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      .mockResolvedValueOnce({
        data: { user: { ...mockUser, identities: singleIdentity } },
        error: null,
      });

    const { DELETE } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("DELETE", { identityId: "identity-1" });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("LAST_IDENTITY");
  });

  it("returns 400 when identityId is missing", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

    const { DELETE } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("DELETE", {});
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when unlinkIdentity fails", async () => {
    mockGetUser
      .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      .mockResolvedValueOnce({
        data: { user: { ...mockUser, identities: mockIdentities } },
        error: null,
      });
    mockUnlinkIdentity.mockResolvedValue({ error: { message: "Unlink failed" } });

    const { DELETE } = await import("@/app/api/user/identities/route");
    const request = createMockRequest("DELETE", { identityId: "identity-1" });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("AUTH_ERROR");
    expect(body.error.message).toBe("Unlink failed");
  });
});
